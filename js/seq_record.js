/*global jQuery */
(function($) {
  "use strict";

  var GEP = $.fn.GEP,

  SeqRecord = (function () {
    var defaults = {
      id: "unknown",
      description: "",
      sequence: "",
      wordSize: 11
    };

    function SeqRecord(props) {
      props = props || {};

      this.id = props.id || defaults.id;
      this.description = props.description || defaults.description;
      this.sequence = props.sequence || defaults.sequence;
      this.coords = props.coords || null;

      this.bases = null;
      this.words = null;
    }

    SeqRecord.prototype.complementInfo = {
      "A":"T", "C":"G", "T":"A", "G":"C", "N":"N"
    };

    SeqRecord.prototype.getBases = function() {
      if (this.bases === null) {
        this.bases = this.sequence.split('');
      }

      return this.bases;
    };

    SeqRecord.prototype.reverseComplement = function() {
      var bases = this.getBases(),
          lastIdx = this.sequence.length - 1,
          complement = this.complementInfo,
          i,
          results = [];

      for (i = lastIdx; i >= 0; i -= 1) {
        results.push(complement[bases[i]] || bases[i]);
      }

      return results.join("");
    };

    SeqRecord.prototype.extractRegion = function(regionInfo) {
      regionInfo = regionInfo || {};

      var start = regionInfo.start || 0,
          end = regionInfo.end || this.sequence.length;

      return this.sequence.substr(start, end - start);
    };

    SeqRecord.prototype.getLength = function() {
      return this.sequence.length;
    };

    return SeqRecord;
  }());

  GEP.SeqRecord = SeqRecord;
}(jQuery));
