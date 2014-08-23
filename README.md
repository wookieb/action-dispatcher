# Action dispatcher

Proxy between controllers and view for extensible apps.

## Install
```
npm install --save action-dispatcher
```

## How it works?
The idea is really simple: "Do not bind controllers and views".
Allow any controller, module, plugin to register a listener on their own.

Dispatcher will call the listeners in the order defined by priority.
If the listener returns a promise then further execution will be paused until the promise will be fulfilled.

Treat the action as a function to execute upon particular UI action but instead of defining the body of the function
allow anyone to define own steps to perform.

Basically action dispatcher is similar to regular event dispatcher with major differences:
* supports listeners priorities
* does not ignore promises returned by listeners
* ActionsDispatcher.prototype.dispatch always returns a promise
* define the context of listener (to avoid creation of unnecessary functions via Function.prototype.bind)

## How to use?
```javascript
var Action = require('action-dispatcher');

var onNewTodoItem = new Action();

onNewTodoItem.addListener(controller.addItem, controller); // second argument is a context of function
onNewTodoItem.addListener(function(todo) {
    // display new notification in notifications bar
    notifications.add('New task has been created', 'success');
});

// called from view layer
onNewTodoItem.dispatch(new Todo({content: "Help my superman!"));
```

### Listener arguments
```javascript
action.addListener(function(arg1, arg2) {
    console.log(arg1, arg2);
});
action.addListener(function(arg1, arg2) {
    console.log(arg1, arg2);
});

action.dispatch(1, 2);
// 1, 2
// 1, 2
```

### Priorities

Listeners are executed in the order defined by priority (in ascending order);
```javascript
action.addListener(function() { console.log(2); }, undefined, 5);
action.addListener(function() { console.log(3); }, undefined, 5);
action.addListener(function() { console.log(1); }, undefined, 1);
action.addListener(function() { console.log(4); }); // default priority = 20

action.dispatch();
// 1
// 2
// 3
// 4
```

#### Predefined priorities
ActionDispatcher has 3 predefined priorities:
* Before handlers: 5
* Handlers: 10
* After handlers: 15

You can use them with the following methods:
* addListenerBeforeHandlers
* addHandler
* addListenerAfterHandlers

It's a good practice to group the listeners into predefined priorities for semantic reasons.

```javascript

// set title of window
action.addListenerBeforeHandlers(function(todo) {
    document.querySelector('title').innerHTML = 'Saving ...';
});

// save the item
action.addHandler(controller.addItem, controller);

// display a notification
action.addListenerAfterHandlers(function(todo) {
    // display new notification in notifications bar
    notifications.add('New task has been created', 'success');
});
```

### Promises
Every listener may return a promise that pauses the process of action dispatching until the promise will be fulfilled.

```javascript
action.addListener(function() {
    console.log('Superman! Help me!');
    return new Promise(function(resolve) {
        setTimeout(resolve, 1000);
    });
});

action.addListener(function() {
    console.log('I am superman - I am helping');
});

action.dispatch()
    .then(function() {
        console.log('Great success!');
    });

// Superman! Help me!
// ... wait 1 second ...
// I am superman - I am helping
// Great success!
```

### API

**addListener(listener [,context = undefined [, priority = 20]])**

*listener* - function to call

*context* - context of listener function

*priority* - listener priority, lower number = higher precedence


**removeListener(listener [,context = undefined [, priority = 20]])**

Remember to provide exactly same arguments as for listener registration.

**dispatch(args...)**
Dispatches the action with given arguments

## Why i should use it?
@TODO In progress

## Real use cases
@TODO In progress
