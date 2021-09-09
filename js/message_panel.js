/*global jQuery console */

(function($) {
  "use strict";

  var GEP = $.fn.GEP,
      eventManager = GEP.eventManager,
      MessagePanel;

  MessagePanel = (function () {
    var defaults = { eventPrefix: "message",
                     type: "success",
                     icons: {
                       "wait": "fa-spinner fa-spin",
                       "info": "fa-info-circle",
                       "success": "fa-check-circle",
                       "warn": "fa-exclamation-circle",
                       "error": "fa-times-circle"
                     }
                   };

    function MessagePanel(panelId, cfg) {
      this.settings = GEP.util.mergeConfig(defaults, cfg);

      var getById = GEP.util.getById,
          eventPrefix = this.settings.eventPrefix,
          that = this;

      this.id = panelId;
      this.panel = getById(panelId);
      this.messageElement = getById(panelId + "-message");
      this.iconElement = getById(panelId + "-icon");

      eventManager.on(eventPrefix + ":show", function (prop) { that.show(prop); });
      eventManager.on(eventPrefix + ":hide", function() { that.hide(); });
    }

    MessagePanel.prototype.showWait = function(prop) {
      prop.type = "wait";
      this.show(prop);
    };

    MessagePanel.prototype.showError = function(prop) {
      prop.type = "error";
      this.show(prop);
    };

    MessagePanel.prototype.show = function(prop) {
      var message = prop.message,
          type = prop.type || "info";

      this.messageElement.html(message);

      this.panel.attr("class", "message " + type);
      this.iconElement.attr("class", "fa pull-left " + defaults.icons[type]);

      this.panel.removeClass("hidden");
    };

    MessagePanel.prototype.hide = function() {
      this.panel.addClass("hidden");
    };

    return MessagePanel;
  }());

  GEP.MessagePanel = MessagePanel;

}(jQuery));
