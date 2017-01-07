// @TODO Write e.single() = limted listener. A single() is an event name that cannot have more than one listener attached to it. New events overwrite.
// @TODO Write e.once() = limted listener. A once() is an event whose function is called only once. Once the function is called, it is removed and cannot be accessed again.
// @TODO Comb through to remain consistant in naming conventions currently e / _name - pick one
// @TODO Return "this" in an intelligent way so that e.emit().emit() etc can work

 // The main Vent.js function
 function vent() {

   // Create the global _listen object
   // It contains:
   // scope '0' - the default scope that all events are stored against.
   // scope '1' - the default scope that all single() events are stored against.
   this._listen = {0:{},1:{}};

   // Wildcare listener is created to register all emits
   // Doesn't need to be listened to, and is applied to scope '0'
   this._listen[0]["*"] = {'handlers': []};
   // emit('*') always fires for every event if being listened to
   // Thus no events are lost - good for development and tracing

   // Create the "o" array to add options to
   this.o = [];
   this.o.seperator = " ";
 }

 // Utility to grab the keys of an object where Object.keys isn't featured
 vent.prototype._keys = function (arg){
   if (!Object.keys) {
     Object.keys = function(obj) {
       var keys = [];
       for (var i in obj) {
         if (obj.hasOwnProperty(i)) {
           keys.push(i);
         }
       }
       return keys;
     };
   }
   return Object.keys(arg);
 }

 vent.prototype._set = function(e, _handler, _scope, _single) {
   // e: the even name
   // _handler: the function called by emit() / trigger()
   // _scope: the garbage scope of this function (so that when files are unloaded, the scope is cleared, which accounts for frames)
   // _single: bolean - should the event be set to a single()?

   // Provide the default scope when none is provided
   var _scope = _scope ? _scope : 0;
   // detect single() request
   var _single = _single ? _single : false;

  // Check if the scope has been used, if not create it
  if(!this._listen[_scope]){
    this._listen[_scope] = {};
  }

  // Check if event is within that scope, if not add it
  if (typeof this._listen[_scope][e] === "undefined") {
    this._listen[_scope][e] = {'handlers': []};
  }

  if(_single){
    this._listen[_scope][e].single = true;
  }

  // @TODO _handler should be a function - register performance of this test
  if(typeof _handler === 'function'){
    if(this._listen[_scope][e].single){
      this._listen[_scope][e].handlers = [].push(_handler);
    } else {
      this._listen[_scope][e].handlers.push(_handler);
    }
    // Add the _handler object to the array of handlers
  } else {
    // Ignore it as it wasn't a function
    // @TODO throw an error
    return false;
  }

  return this;

};


 vent.prototype.registerScope = function(_scope, _window) {

   if(_window){

     // @TODO Stop being a lazy Chromium fanboy and account for multiple browsers
     _window.addEventListener('beforeunload', function(event) {
       e.removeScope(_scope)
     });

   }

 }


vent.prototype.on = function(e, _handler, _scope) {
 this._set(e, _handler, _scope)
}

vent.prototype.single = function(e, _handler, _scope) {
 this._set(e, _handler, _scope, true)
}

vent.prototype._events = function(_scope) {
  // Provide a list of keys which present the names listened to
  // This list is contructed by the on() function when events are subscribed too

  if(!_scope){
    // Loop through the scopes to get all events within all scopes
    var scopes = this._keys(this._listen);
    // Blank events
    var events = []
     // Loop through each scope
     for(var i=0;i<scopes.length;i++){
       events = events.concat(this._keys(this._listen[scopes[i]]))
     }
     return events;
  } else {
    if(this._listen[_scope]){
      // return a list of keys
      return this._keys(this._listen[_scope]);
    } else {
      // There are no listeners currently within the scope to return an empty array
      return [];
    }
  }

};


vent.prototype._scopes = function() {
 // Provide a list of keys which present the names listened to
 // This list is contructed by the on() function when events are subscribed too
 // But also those events that are firing, but haven't been subscribed too.
 // Easy way for developer to code in checks to see what events are A: being listened to, and B: being fired
 if(this._listen){
   // return a list of keys
     return this._keys(this._listen);
 } else {
   // There are no listeners currently
   return false;
 }
};

vent.prototype.once = function (e, _handler, _scope) {

 var _scope = _scope ? _scope : 0;

 // Copy current scope so it isn't overwritten
 var that = this;

 // Create an internal scoped function to call .off("")
 // The fuction would register the event name "e", and the "_handler" so that only that handler
 // is removed and not all the handlers for that event name
 function fn() {
   // Call .off()
   that.off(e, fn, _scope);

   // @TODO convert this to call() to match the update
   _handler.apply(this, arguments);
 }

 // Create a
 fn._handler = _handler;

 this._set(e, fn, _scope);

 return this;
};

vent.prototype.off = function (e, _handler, _scope) {

 var _scope = _scope ? _scope : 0;

 // abandon if no such scope exists
 if(!this._listen[_scope]){
   return false;
 }

   var _listen = this._listen[_scope][e];

   // Check to see if any events are actually registered
   // "undefined" will present when the _listen object
   // doesn't return for this index
   if (typeof _listen === "undefined") {
     return false;
   } else {
     // Loop through the _handlers given by the _listen object
     for (var j = 0; j < _listen.handlers.length; j += 1) {
       // Check to see if the handler is stored
       if (_listen.handlers[j] === _handler) {
         // if it is, remove it
         _listen.handlers.splice(j, 1);
         // Handler found and removed, stop the loop
         break;
       }
     }
   }

   // Check if that last removal was the last one
   if (_listen.handlers.length === 0) {
     // if it is, then send for deletion
     this._removeAll_handlers(e, _scope);
   }

};

// Remove all listeners for the event named under the scope provided
vent.prototype._removeAll = function (e, _scope) {

 // set the default scope if none provided
 var _scope = _scope ? _scope : 0;

 // abandon if no such scope exists
 if(typeof this._listen[_scope] === "undefined"){
   return false;
 }

 if(typeof this._listen[_scope][e]==="undefined"){
   return false;
 } else {
   // Delete the event "e" from the _listen object
   delete this._listen[e].handlers;
 }

};

vent.prototype._replaceAll = function (e, _handler, _scope) {

 // remove all the handlers for event "e"
 this._removeAll(e, _scope);

 // reset the listener for just the current handler
 this.on(e, _handler, _scope)

 // return the current context
 return this;

};

vent.prototype._handlers = function (e, _scope) {
  // @TODO return all handers if no scope is provided?

  // set the default scope if none provided
  var _scope = _scope ? _scope : 0;

  // abandon if no such scope exists
  if(typeof this._listen[_scope] === "undefined"){
    return false;
  }

  // abandon if no such event exists under the current scope
  if(typeof this._listen[_scope][e]==="undefined"){
    return false;
  } else {
    return this._listen[_scope][e].handers;
  }

};


vent.prototype.emit = function (_name, _payload, _callback) {
   var i = 0;
   // grab all scopes
   var keys = this._keys(this._listen);
   // loop through all scopes and fire event at each scope
   for(;i<keys.length;i++){
     this.scope(keys[i], _name, _payload, _callback)
   }
};

vent.prototype.trigger = vent.prototype.emit;

vent.prototype.scope = function (_scope, _name, _payload, _callback) {
 // Fire an event limited to a scope

 var e = _name;
 // create a noop callback if none is set
 var _callback = _callback ? _callback : function (){}

 var names = e.split(this.o.seperator);

 for(var i = 0; i<names.length;i++){
   // Copy the array "slice(0)", build section and join with seperator
   var name = names.slice(0).splice(0,i+1).join(this.o.seperator);

   // Create an object full of the _handler functions stored for the event "e"
   if(this._listen[_scope][name]){
     var _handlers = this._listen[_scope][name].handlers;

     // Check if any _handlers exist
     if (_handlers) {
       _handlers = _handlers.slice(0);
       var len = _handlers.length;
       for (var j=0; j < len; j += 1) {
         _handlers[j].call(this, _name, _payload, _callback, _scope);
       }
     }

   }
 }

 if (this._listen[0]["*"].handlers) {
   _handlers = this._listen[0]["*"].handlers;
   var len = _handlers.length;
   for (var j=0; j < len; j += 1) {
     this._listen[0]["*"].handlers[j].call(this,  _name, _payload, _callback, _scope);
   }
 }

 return this;

}

vent.prototype.removeScope = function (_scope) {
 // delete a scope of events
 if(typeof this._listen[_scope] === "undefined"){
   return false;
 } else {
   return delete this._listen[_scope];
 }
}

var _vent = new vent();

module.exports = _vent;
