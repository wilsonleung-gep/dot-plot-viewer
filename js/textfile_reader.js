/*global jQuery */
(function($) {
  "use strict";

  var GEP = $.fn.GEP,
      eventManager = GEP.eventManager,

  TextfileReader = (function () {
    var eol = { "windows": "\r\n", "mac": "\r", "unix": "\n" },
        defaults = { eventPrefix: "textfileReader" };

    function TextfileReader(fieldId, cfg) {
      this.settings = GEP.util.mergeConfig(defaults, cfg);

      this.id = fieldId;
      this.field = GEP.util.getById(fieldId);
    }

    TextfileReader.prototype.readFileAsync = function(idx) {
      var infile = this.getFile(idx),
          that = this,
          fileReader = new window.FileReader(),
          deferred = $.Deferred();

      fileReader.onload = function (event) {
        var content = GEP.util.tryGetProperty(event, "target.result");

        deferred.resolve(that.loadContentAsync(content));
      };

      fileReader.onerror = function () {
        deferred.reject(that);
      };

      fileReader.readAsText(infile);

      return deferred.promise();
    };

    TextfileReader.prototype.getFile = function (idx) {
      idx = idx || 0;

      var fileList = this.field[0].files,
          numFiles = fileList.length;

      if (numFiles === 0) {
        throw new Error("No file has been selected: " + this.id);
      }

      if (idx >= numFiles) {
        throw new Error("Invalid index: " + idx + "; Number of files: " + numFiles);
      }

      return fileList[idx];
    };

    TextfileReader.prototype.loadContentAsync = function (content) {
      var eventPrefix = this.settings.eventPrefix,
          lineSeparator,
          lines;

      if (!content) {
        eventManager.fire(eventPrefix + ":error", {
          message: "Cannot read file"
        });
      }

      lineSeparator = this.determineEol(content);
      lines = content.split(lineSeparator);

      return lines;
    };

    TextfileReader.prototype.determineEol = function (content) {
      if (content.indexOf(eol.windows) >= 0) {
        return eol.windows;
      }

      if (content.indexOf(eol.mac) >= 0) {
        return eol.mac;
      }

      return eol.unix;
    };

    return TextfileReader;
  }());

  GEP.TextfileReader = TextfileReader;
}(jQuery));
