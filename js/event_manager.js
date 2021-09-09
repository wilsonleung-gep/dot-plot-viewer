/*global jQuery */
(function($) {
  "use strict";
  var GEP = $.fn.GEP,

  EventManager = (function () {
    function EventManager() {
      this.events = [];
    }

    EventManager.prototype.on = function(eventName, func) {
      if (!this.events[eventName]) {
        this.events[eventName] = [];
      }

      this.events[eventName].push(func);
    };

    EventManager.prototype.fire = function(eventName, obj) {
      var subscribers = this.events[eventName] || [],
          subscriber,
          numEvents = subscribers.length,
          i;

      for (i = 0; i < numEvents; i += 1) {
        subscriber = subscribers[i];
        subscriber(obj);
      }
    };

    return EventManager;
  }());

  GEP.eventManager = new EventManager();
}(jQuery));
