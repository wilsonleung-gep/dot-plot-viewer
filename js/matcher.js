/*global jQuery */
(function($) {
  "use strict";

  var GEP = $.fn.GEP,

  Matcher = (function () {
    var defaults = {
      worker: "js/wordsimilarity_worker-min.js",
      wordSize: 3,
      threshold: 11,
      matrix: "BLOSUM62"
    };

    function Matcher(querySeq, subjectSeq, cfg) {
      this.settings = GEP.util.mergeConfig(defaults, cfg);

      this.querySeq = querySeq;
      this.subjectSeq = subjectSeq;
      this.matrix = [];
    }

    Matcher.prototype.isInitialized = function() {
      return ((this.matrix.length > 0) && (this.matrix[0].length > 0));
    };

    Matcher.prototype.getMatrixScores = function() {
      if (!this.isInitialized()) {
        throw new Error("Matrix has not been initialized");
      }

      return this.matrix;
    };

    Matcher.prototype.getQueryId = function() {
      return this.querySeq.id;
    };

    Matcher.prototype.getSubjectId = function() {
      return this.subjectSeq.id;
    };

    Matcher.prototype.getQueryLength = function() {
      return this.querySeq.getLength();
    };

    Matcher.prototype.getSubjectLength = function() {
      return this.subjectSeq.getLength();
    };

    Matcher.prototype.hasRegions = function() {
      return (this.querySeq.coords || this.subjectSeq.coords);
    };

    Matcher.prototype.getQueryCoords = function() {
      return this.querySeq.coords;
    };

    Matcher.prototype.getSubjectCoords = function() {
      return this.subjectSeq.coords;
    };

    Matcher.prototype.calcMatchesAsync = function() {
      var worker = new window.Worker(this.settings.worker),
          deferred = $.Deferred();

      worker.addEventListener("message", function(e) {
        var response = e.data || {},
            status = response.status,
            result;

        if (status === "success") {
          result = response.result;

          this.matrix = result;
          deferred.resolve(result);

        } else {
          deferred.reject(response);
        }
      });

      worker.addEventListener("error", function(e) {
        deferred.reject({
          "status": "error",
          "message": e.message || e
        });
      });

      worker.postMessage({
        query: this.querySeq.sequence,
        subject: this.subjectSeq.sequence,
        wordSize: this.settings.wordSize,
        threshold: this.settings.threshold,
        matrix: this.settings.matrix
      });

      return deferred.promise();
    };

    return Matcher;
  }());

  GEP.Matcher = Matcher;
}(jQuery));
