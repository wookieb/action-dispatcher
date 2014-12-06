!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ActionDispatcher=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Promise = (typeof window !== "undefined" ? window.Promise : typeof global !== "undefined" ? global.Promise : null);

var addListenerForPriority = function(priority) {
        return function(listener, listenerContext) {
            ActionDispatcher.prototype.addListener.call(this, listener, listenerContext, priority);
        }
    },
    removeListenerForPriority = function(priority) {
        return function(listener, listenerContext) {
            ActionDispatcher.prototype.removeListener.call(this, listener, listenerContext, priority);
        }
    },
    findIndexForNewListenerAtPriority = function(priority) {
        var foundIndex = 0;
        this._listeners.some(function(listenerObject, index) {
            if (listenerObject.priority > priority) {
                return true;
            }
            foundIndex = index+1;
        });
        return foundIndex;
    },
    findListenerIndex = function(listener, listenerContext, priority) {
        var result = -1;
        this._listeners.some(function(listenerObject, index) {
            if (listenerObject.handler === listener &&
                listenerObject.context === listenerContext &&
                listenerObject.priority === priority) {
                result = index;
                return true;
            }
        });
        return result;
    },
    executeListener = function(listeners, index, args, resolve, reject) {
        var listener = listeners[index];

        // no more listeners
        if (typeof listener === 'undefined') {
            resolve();
            return;
        }

        // catch any errors and
        try {
            var listenerResult = listener.handler.apply(listener.context, args);
            if (isThenable(listenerResult)) {
                listenerResult.then(function() {
                    executeListener(listeners, index+1, args, resolve, reject);
                }, reject);
                return;
            }
        } catch (e) {
            // reject master promise
            reject(e);
            return;
        }

        executeListener(listeners, index+1, args, resolve, reject);
    },
        isThenable = function(value) {
        return typeof value !== 'undefined' &&
            value !== null &&
            'then' in value &&
            typeof value.then === 'function';
    };

var ActionDispatcher = function() {
    this._listeners = [];
    this.dispatchWithContext = this.dispatch.bind(this);
};

ActionDispatcher.BEFORE_HANDLERS_PRIORITY = 5;
ActionDispatcher.HANDLERS_PRIORITY = 10;
ActionDispatcher.AFTER_HANDLERS_PRIORITY = 15;
ActionDispatcher.DEFAULT_PRIORITY = 20;

ActionDispatcher.prototype = {
    constructor: ActionDispatcher,
    addListenerBeforeHandlers: addListenerForPriority(ActionDispatcher.BEFORE_HANDLERS_PRIORITY),
    removeListenerBeforeHandlers: removeListenerForPriority(ActionDispatcher.BEFORE_HANDLERS_PRIORITY),
    addHandler: addListenerForPriority(ActionDispatcher.HANDLERS_PRIORITY),
    removeHandler: removeListenerForPriority(ActionDispatcher.HANDLERS_PRIORITY),
    addListenerAfterHandlers: addListenerForPriority(ActionDispatcher.AFTER_HANDLERS_PRIORITY),
    removeListenerAfterHandlers: removeListenerForPriority(ActionDispatcher.AFTER_HANDLERS_PRIORITY),
    addListener: function(listener, listenerContext, priority) {
        priority = (typeof priority === 'undefined' && ActionDispatcher.DEFAULT_PRIORITY) || +priority;
        var newIndex = findIndexForNewListenerAtPriority.call(this, priority);
        this._listeners.splice(newIndex, 0, {
            handler: listener,
            context: listenerContext,
            priority: priority
        });
    },
    removeListener: function(listener, listenerContext, priority) {
        priority = (typeof priority === 'undefined' && ActionDispatcher.DEFAULT_PRIORITY) || +priority;
        var index = findListenerIndex.call(this, listener, listenerContext, priority);
        index !== -1 && this._listeners.splice(index, 1);
        return index !== -1;
    },
    dispatch: function() {
        var listeners = this._listeners,
            args = arguments;
        return new Promise(function(resolve, reject) {
            executeListener(listeners, 0, args, resolve, reject);
        });
    }
};

module.exports = ActionDispatcher;

},{}]},{},[1])(1)
});