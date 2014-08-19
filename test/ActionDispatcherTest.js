'use strict';

var assert = require('chai').assert,
    ActionDispatcher = require('../src/ActionDispatcher'),
    Promise = require('promise');

var promisifyListener = function(listener) {
        return function() {
            return new Promise(function(resolve, reject) {
                setTimeout(function() {
                    try {
                        listener();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                }, 100);
            })
        }
    },
    argsToArray = function(args) {
        return Array.prototype.slice.call(args);
    };

describe('ActionDispatcher', function() {
    var dispatcher,
        result,
        listenerError = new Error('Fixture error'),
        listenerPush1 = function() {
            result.push(1);
        },
        listenerPush2 = function() {
            result.push(2);
        },
        listenerPush3 = function() {
            result.push(3);
        },
        listenerPush4 = function() {
            result.push(4)
        },
        listenerWithError = function() {
            throw listenerError;
        },
        listenerPush1Promisified = promisifyListener(listenerPush1),
        listenerPush2Promisified = promisifyListener(listenerPush2),
        listenerPush3Promisified = promisifyListener(listenerPush3),
        listenerWithErrorPromisified = promisifyListener(listenerWithError),
        listenerWithContext = function() {
            result.push(this);
        },

        exampleContext = {dirty: 'dishes'},
        exampleContext2 = {wire: 'socks'};


    beforeEach(function() {
        result = [];
        dispatcher = new ActionDispatcher();
    });

    describe('registering listeners', function() {
        var expectedResult;

        afterEach(function() {
            dispatcher.dispatch();
            assert.deepEqual(expectedResult, result);
        });

        it('adding listeners with same priority', function() {
            dispatcher.addListener(listenerPush1);
            dispatcher.addListener(listenerPush2);
            dispatcher.addListener(listenerPush3);
            expectedResult = [1, 2, 3];
        });

        it('adding with different priorities', function() {
            dispatcher.addListener(listenerPush1, undefined, 20);
            dispatcher.addListener(listenerPush2, undefined, 40);
            dispatcher.addListener(listenerPush3, undefined, 1);
            expectedResult = [3, 1, 2];
        });

        it('adding with predefined priorities', function() {
            dispatcher.addListener(listenerPush4);
            dispatcher.addListenerBeforeHandlers(listenerPush1);
            dispatcher.addListenerAfterHandlers(listenerPush3);
            dispatcher.addHandler(listenerPush2);
            expectedResult = [1, 2, 3, 4];
        });
    });

    describe('removing listeners', function() {
        var expectedResult;
        beforeEach(function() {
            dispatcher.addListener(listenerPush1, undefined, 1);
            dispatcher.addListener(listenerPush2);
            dispatcher.addListener(listenerWithContext, exampleContext);
            dispatcher.addListener(listenerWithContext, exampleContext2, 2);

            expectedResult = [1, exampleContext2, 2, exampleContext];
        });

        afterEach(function() {
            dispatcher.dispatch();
            assert.deepEqual(expectedResult, result);
        });

        it('removing proper listener #1', function() {
            assert.ok(dispatcher.removeListener(listenerPush1, undefined, 1));
            expectedResult.splice(0, 1);
        });

        it('removing proper listener #2', function() {
            assert.ok(dispatcher.removeListener(listenerWithContext, exampleContext));
            expectedResult.splice(3, 1);
        });

        it('removing invalid listener (different priority)', function() {
            assert.notOk(dispatcher.removeListener(listenerPush1, undefined, 2));
            assert.notOk(dispatcher.removeListener(listenerWithContext, exampleContext, 5));
        });

        it('removing invalid listener (different context)', function() {
            assert.notOk(dispatcher.removeListener(listenerPush1, exampleContext, 1));
            assert.notOk(dispatcher.removeListener(listenerWithContext, undefined));
        });

        it('removing all listeners', function() {
            assert.ok(dispatcher.removeListener(listenerPush1, undefined, 1));
            assert.ok(dispatcher.removeListener(listenerPush2));
            assert.ok(dispatcher.removeListener(listenerWithContext, exampleContext));
            assert.ok(dispatcher.removeListener(listenerWithContext, exampleContext2, 2));

            expectedResult = [];
        });
    });

    describe('dispatching', function() {
        it('regular listeners', function() {
            dispatcher.addListener(listenerPush1);
            dispatcher.addListener(listenerPush2);

            dispatcher.dispatch();
            assert.deepEqual([1, 2], result);
        });

        it('async listeners', function(done) {
            dispatcher.addListener(listenerPush1);
            dispatcher.addListener(listenerPush2Promisified);
            dispatcher.addListener(listenerPush3);

            var promise = dispatcher.dispatch();
            assert.deepEqual([1], result);
            promise
                .then(function() {
                    assert.deepEqual([1, 2, 3], result);
                    done();
                })
                .catch(done);
        });

        it('listeners that throws an error', function(done) {
            dispatcher.addListener(listenerPush1);
            dispatcher.addListener(listenerWithError);
            dispatcher.addListener(listenerPush3);

            var promise = dispatcher.dispatch();
            assert.deepEqual([1], result);

            promise
                .then(function() {
                    assert.fail('Promise should not be resolved');
                }, function(error) {
                    assert.strictEqual(listenerError, error);
                    assert.deepEqual([1], result);
                    done();
                })
                .catch(done);
        });

        it('async listeners that throws an error', function(done) {
            dispatcher.addListener(listenerPush1);
            dispatcher.addListener(listenerWithErrorPromisified);
            dispatcher.addListener(listenerPush3);

            var promise = dispatcher.dispatch();
            assert.deepEqual([1], result);

            promise
                .then(function() {
                    assert.fail('Promise should not be resolved');
                }, function(error) {
                    assert.strictEqual(listenerError, error);
                    assert.deepEqual([1], result);
                    done();
                })
                .catch(done);
        });

        it('many async listeners', function(done) {
            dispatcher.addListener(listenerPush1Promisified);
            dispatcher.addListener(listenerPush2Promisified);
            dispatcher.addListener(listenerPush3Promisified);


            var promise = dispatcher.dispatch();
            assert.deepEqual([], result);
            promise
                .then(function() {
                    assert.deepEqual([1, 2, 3], result);
                    done();
                })
                .catch(done);
        });

        it('with given arguments', function() {
            var args = [1, 2, 3],
                calls = 0;

            dispatcher.addListener(function() {
                calls++;
                assert.deepEqual(args, argsToArray(arguments));
            });

            dispatcher.addListener(function() {
                calls++;
                assert.deepEqual(args, argsToArray(arguments));
            });

            dispatcher.dispatch.apply(dispatcher, args);
            assert.equal(2, calls);
        });

        it('in given context', function() {
            var calls = 0;
            dispatcher.addListener(function() {
                calls++;
                assert.strictEqual(exampleContext, this);
            }, exampleContext);

            dispatcher.dispatch();
            assert.equal(1, calls);
        });
    });
});
