/*global jQuery window */
(function($) {
  "use strict";

  var GEP = (function () {
    var plugin, data, exceptions;

    plugin = {};

    data = {
      flyBaseUrl: "http://flybase.org",
      genomeBrowserRoot: "[URL for the UCSC Genome Browser hgTracks CGI]"
    };

    exceptions = {
      appException: function(message, separator) {
        separator = separator || "\n";

        this.message = message;
        this.name = "GEP_appException";

        this.toString = function() {
          var errorMessages =
                $.isArray(message) ? message.join(separator) : message;

          return errorMessages;
        };

        return this;
      }
    };

    function fetch(record, key, defaultValue) {
      var value = defaultValue;

      if ((record !== undefined) && (record[key] !== undefined)) {
        value = record[key];
      }

      if (value === undefined) {
        throw new TypeError("Cannot find key: " + key + " in record");
      }

      return value;
    }

    function getElementById(id) {
      var elem = document.getElementById(id);

      if (!elem) {
        throw new ReferenceError("Cannot find element: " + id);
      }

      return elem;
    }

    function getById(id) {
      var elem = getElementById(id);

      return $(elem);
    }

    function create(o) {
      if (Object.create) {
        return Object.create(o);
      }

      function F(){ return; }
      F.prototype = o;
      return new F();
    }

    function joinURI(baseURL, pathsURL) {
      var combinedURL =
            baseURL.replace(/(\/)+$/, "") + "/" +
            pathsURL.replace(/^(\/)+/, "");

      return encodeURI(combinedURL);
    }

    function mergeConfig(defaults, options) {
      return $.extend({}, defaults, options);
    }

    function tryGetProperty(obj, path) {
      var components = path.split("."),
          parent = obj,
          numComponents = components.length,
          i;

      for (i = 0; i < numComponents; i += 1) {
        parent = parent[components[i]];

        if (!parent) {
          return null;
        }
      }

      return parent;
    }

    function tryParseInt(str) {
      var m = str.match(/^\s*(\d+)\s*$/);

      if (m) {
        return parseInt(m[1], 10);
      }

      return null;
    }

    function parseRegionStr(str, separator) {
      separator = separator || ",";

      var valuesStr = str.split(separator),
          numValues = valuesStr.length,
          i, value, values = [];

      for (i = 0; i < numValues; i += 1) {
        value = tryParseInt(valuesStr[i]);

        if (value === null) {
          throw new Error("Region coordinates contain non-integers " + valuesStr[i]);
        }

        values.push(value);
      }

      return values;
    }

    function parseGetParameters(paramsStr) {
      var params = {}, pairs, numPairs, i, m;

      if ((paramsStr) && (paramsStr.indexOf("?") === 0)) {
        pairs = paramsStr.substr(1).split("&");
        numPairs = pairs.length;

        for (i = 0; i < numPairs; i += 1) {
          m = pairs[i].match(/(\S+)=(\S+)/);

          if (m) {
            params[m[1]] = decodeURIComponent(m[2]);
          }
        }
      }

      return params;
    }

    return {
      plugin: plugin,
      data: data,
      exceptions: exceptions,
      util: {
        fetch: fetch,
        getById: getById,
        create: create,
        joinURI: joinURI,
        mergeConfig: mergeConfig,
        tryGetProperty: tryGetProperty,
        tryParseInt: tryParseInt,
        parseRegionStr: parseRegionStr,
        getElementById: getElementById,
        parseGetParameters: parseGetParameters
      }
    };
  }());

  $.fn.GEP = GEP;
}(jQuery));
