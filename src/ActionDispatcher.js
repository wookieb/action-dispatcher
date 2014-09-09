var Promise = require('promise');

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
