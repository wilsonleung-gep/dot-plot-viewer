/*global GEPMatrix */
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
        wordList = [],
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
        wordList.push(word);
      }
      words[word].push(i);
    }

    return {
      lookupTable: words,
      wordList: wordList
    };
  }

  function appendMatches(matches, queryPositions, subjectPositions, wordSize) {
    var queryPos, subjectPos,
        numQueryPositions = queryPositions.length,
        numSubjectPositions = subjectPositions.length,
        i, j;

    for (i = 0; i < numQueryPositions; i += 1) {
      queryPos = queryPositions[i];

      for (j = 0; j < numSubjectPositions; j += 1) {
        subjectPos = subjectPositions[j];

        matches.push({
          start: { x: queryPos, y: subjectPos },
          end:   { x: queryPos + wordSize, y: subjectPos + wordSize }
        });
      }
    }
  }

  function calcWordScore(qWord, sWord, matrix) {
    var wordLength, matchScore, i, key, sum = 0;

    wordLength = qWord.length;
    for (i = 0; i < wordLength; i += 1) {
      key = qWord.substr(i, 1) + sWord.substr(i, 1);

      matchScore = fetch(matrix, key, 0);
      sum += matchScore;
    }

    return sum;
  }

  function storeHighScoringMatches(queryWords, subjectWords, cfg) {
    var matches = [],
        wordSize = fetch(cfg, "wordSize"),
        threshold = fetch(cfg, "threshold"),
        scoreMatrix = fetch(cfg, "scoreMatrix"),

        queryLookup = queryWords.lookupTable,
        subjectLookup = subjectWords.lookupTable,

        queryWordList = queryWords.wordList,
        subjectWordList = subjectWords.wordList,

        numQueryWords = queryWordList.length,
        numSubjectWords = subjectWords.wordList.length,

        i, j, score, qWord, sWord;

    for (i = 0; i < numQueryWords; i += 1) {
      qWord = queryWordList[i];

      for (j = 0; j < numSubjectWords; j += 1) {
        sWord = subjectWordList[j];

        score = calcWordScore(qWord, sWord, scoreMatrix);

        if ((qWord === sWord) || (score >= threshold)) {
          appendMatches(matches,
                        queryLookup[qWord], subjectLookup[sWord], wordSize);
        }
      }
    }

    return matches;
  }

  function loadScoringMatrix(cfg) {
    var matrixName = fetch(cfg, "matrix");

    try {
      self.importScripts("matrix/" + matrixName + ".js");
      cfg.scoreMatrix = fetch(GEPMatrix, matrixName);

    } catch (e) {
      throw new Error("Cannot retrieve scoring matrix " + matrixName);
    }
  }

  function calcWordMatches(cfg) {
    var query = fetch(cfg, "query"),
        subject = fetch(cfg, "subject"),
        wordSize = fetch(cfg, "wordSize"),

        queryWords = buildWordTable(query, wordSize),
        subjectWords = buildWordTable(subject, wordSize);

    return storeHighScoringMatches(queryWords, subjectWords, cfg);
  }

  self.addEventListener("message", function(e) {
    try {
      var cfg = fetch(e, "data"),
          matches;

      loadScoringMatrix(cfg);
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
