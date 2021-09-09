/*global jQuery */
(function($) {
  "use strict";
  var GEP = $.fn.GEP,

  SeqReader = (function () {
    var defaults = {
      eventPrefix: "seqReader",
      headerMarker: ">",
      headerWithDescription: /^>(\S+)\s+(.*)$/,
      headerWithoutDescription: /^>(\S+)/
    };

    function SeqReader(lines, cfg) {
      this.settings = GEP.util.mergeConfig(defaults, cfg);

      this.records = this.createSeqRecords(lines);
    }

    SeqReader.prototype.getRecord = function(idx) {
      idx = idx || 0;

      return this.records[idx];
    };

    SeqReader.prototype.createSeqRecords = function(lines) {
      var numLines = lines.length,
          headerMarker = this.settings.headerMarker,
          seqInfo,
          records = [],
          line, i;

      for (i = 0; i < numLines; i += 1) {
        line = lines[i];

        if (line.indexOf(headerMarker) === 0) {
          this.addSeqRecord(records, seqInfo);
          seqInfo = this.initSeqRecord(line);

        } else {
          seqInfo.sequence.push(line);
        }
      }

      this.addSeqRecord(records, seqInfo);

      return records;
    };

    SeqReader.prototype.initSeqRecord = function(headerLine) {
      var id, description, m;

      m = headerLine.match(this.settings.headerWithDescription);

      if (m) {
        id = m[1];
        description = m[2];

      } else {
        m = headerLine.match(this.settings.headerWithoutDescription);

        id = m[1];
        description = "";
      }

      return {
        id: id,
        description: description,
        sequence: []
      };
    };

    SeqReader.prototype.addSeqRecord = function(records, seqInfo) {
      if (!seqInfo) {
        return;
      }

      var seqArray = seqInfo.sequence;
      seqInfo.sequence = seqArray.join("").replace(/\s+/g, "");

      records.push(new GEP.SeqRecord(seqInfo));
    };

    return SeqReader;
  }());

  GEP.SeqReader = SeqReader;
}(jQuery));
