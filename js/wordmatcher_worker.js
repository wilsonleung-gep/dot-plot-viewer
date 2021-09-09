(function() {
  "use strict";

  function isUninitialized(record) {
    return ((record === undefined) || (record === null));
  }

  function fetch(record, key, defaultValue) {
    if (isUninitialized(record)) {
      throw new Error("Record is empty");
    }

    if (isUninitialized(key)) {
      throw new Error("Key is missing");
    }

    var value = (isUninitialized(record[key])) ? defaultValue : record[key];

    if (isUninitialized(value)) {
      throw new Error("Required key: " + key + " is missing");
    }

    return value;
  }

  function buildErrorMessage(error) {
    var msg = "";

    if (error.message) {
      msg = "Error Message: " + error.message;

      if (error.lineno) {
        msg = msg + "; Line: " + error.lineno;
      }

      return msg;
    }

    return "Unknown error";
  }

  function buildWordTable(sequence, wordSize) {
    var words = {},
        word,
        seqLength = sequence.length,
        i;

    if (wordSize > seqLength) {
      throw new Error("Sequence length " + seqLength +
                      " is shorter than word size: " + wordSize);
    }

    for (i = 0; i < seqLength; i += 1) {
      word = sequence.substr(i, wordSize);

      if (word.length !== wordSize) {
        continue;
      }

      if (!words[word]) {
        words[word] = [];
      }
      words[word].push(i);
    }

    return words;
  }

  function appendMatches(matches, matchIndices, subjectPos, wordSize) {
    if (!matchIndices) {
      return;
    }

    var numIndices = matchIndices.length,
        queryPos, i;

    for (i = 0; i < numIndices; i += 1) {
      queryPos = matchIndices[i];

      matches.push({
        start: { x: queryPos, y: subjectPos },
        end:   { x: queryPos + wordSize, y: subjectPos + wordSize }
      });
    }
  }

  function calcWordMatches(cfg) {
    var query = fetch(cfg, "query"),
        subject = fetch(cfg, "subject"),
        wordSize = fetch(cfg, "wordSize"),
        subjectLength = subject.length,

        queryWords = buildWordTable(query, wordSize),
        subjectWord,
        matches = [],
        i;

    for (i = 0; i < subjectLength; i += 1) {
      subjectWord = subject.substr(i, wordSize);

      appendMatches(matches, queryWords[subjectWord], i, wordSize);
    }

    return matches;
  }

  self.addEventListener("message", function(e) {
    try {
      var cfg = fetch(e, "data"),
          matches = calcWordMatches(cfg);

      self.postMessage({
        "status": "success",
        "result": {
          matches: matches
        }
      });

    } catch (error) {
      self.postMessage({ "status": "error", "message": buildErrorMessage(error) });
    }
  });
}());
