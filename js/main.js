/*global jQuery, Modernizr */

(function($) {
  "use strict";

  var GEP = $.fn.GEP,
      hasRemoteData = false,
      getById = GEP.util.getById,
      eventManager = GEP.eventManager,
      messagePanel = new GEP.MessagePanel("messagePanel", eventManager),
      querySeq,
      subjectSeq,
      dotplot;

  function showError(error) {
    messagePanel.showError({
      "message": error.message || error || "Cannot create dot plot"
    });
  }

  function showWait(message) {
    messagePanel.showWait({ "message": message || "Calculating dot plot..."});
  }

  function verifyBrowserCapabilities() {
    if (Modernizr.canvas && Modernizr.filereader && Modernizr.webworkers) {
      return true;
    }

    showError("This viewer requires a <a href='https://browsehappy.com/'>modern web browser</a>.");
    getById("uploadForm").hide();

    return false;
  }

  function tryConvertCoordsToInt(coords, fieldLabel, errors) {
    var i, intValue,
        coordsErrors = [],
        results = [],
        numCoords = coords.length;

    for (i = 0; i < numCoords; i += 1) {
      intValue = GEP.util.tryParseInt(coords[i]);

      if (intValue === null) {
        coordsErrors.push(coords[i]);
      } else {
        results.push(intValue - 1);
      }
    }

    if (coordsErrors.length > 0) {
      errors.push(fieldLabel + " contains invalid coordinates: " + coordsErrors.join(", "));
      return null;
    }

    return results.sort(function(a, b) { return a - b; });
  }

  function validateCoordinateSet(fieldId, errors, prop) {
    prop = prop || {};

    var coordsStr = getById(fieldId).val().replace(/[\s\n]+/g, ""),
        fieldLabel = prop.label || fieldId,
        lastCoords, displayCoords,
        results = [];

    if (coordsStr === "") {
      return null;
    }

    results = tryConvertCoordsToInt(coordsStr.split(","), fieldLabel, errors);

    if (results === null) {
      return null;
    }

    if (results[0] !== 0) {
      results.unshift(0);
    }

    lastCoords = results[results.length - 1];

    if ((prop.maxValue !== undefined) && (lastCoords >= prop.maxValue)) {
      displayCoords = lastCoords + 1;

      errors.push(fieldLabel + " coordinate " + displayCoords + " is greater than sequence length");
      return null;
    }

    return results;
  }

  function validatePositiveInteger(fieldId, errors, prop) {
    prop = prop || {};

    var intValue = GEP.util.tryParseInt(getById(fieldId).val()),
        fieldLabel = prop.label || fieldId,
        minValue = (prop.minValue === undefined) ? 0 : prop.minValue;

    if (intValue === null) {
      errors.push(fieldLabel + " is not a valid integer");
    } else {
      if (intValue >= minValue) {
        return intValue;
      }

      errors.push(fieldLabel + " must be greater than " + minValue);
    }

    return null;
  }

  function verifyFormParameters() {
    var queryFile = getById("queryFile").val(),
        subjectFile = getById("subjectFile").val(),
        wordSize, threshold, matrix, errors = [];

    if (!hasRemoteData) {
      if ((!queryFile) || (queryFile === "")) {
        errors.push("Query file is missing");
      }

      if ((!subjectFile) || (subjectFile === "")) {
        errors.push("Subject file is missing");
      }
    }

    wordSize = validatePositiveInteger("wordSize", errors,
                                       { minValue: 2, label: "Word Size" });

    threshold = validatePositiveInteger("threshold", errors,
                                        { minValue: 0, label: "Neighborhood" });

    matrix = getById("matrix").val();
    if (!matrix) {
      errors.push("Invalid scoring matrix");
    }

    if (errors.length > 0) {
      errors.unshift("Please correct the following errors:");

      return { isValid: false, message: errors.join("<br>") };
    }

    return {
      isValid: true,
      clean: {
        queryFile: queryFile,
        subjectFile: subjectFile,
        wordSize: wordSize,
        threshold: threshold,
        matrix: matrix
      }
    };
  }

  function drawDotPlot(props) {
    var matcher = new GEP.Matcher(querySeq, subjectSeq, props),
        promise = matcher.calcMatchesAsync();

    $.when(promise).done(function (result) {
      dotplot = new GEP.Plotter("dotplot");

      dotplot.draw(matcher, result.matches);

      messagePanel.hide();
      getById("dotplot").removeClass("hidden");

    }).fail(function (error) {
      showError(error);
    });
  }

  function loadSequenceFilesAsync(formStatus) {
    var queryFile = new GEP.TextfileReader("queryFile", { eventPrefix: "queryFile" }),
        subjectFile = new GEP.TextfileReader("subjectFile", { eventPrefix: "subjectFile" }),
        promiseQ = queryFile.readFileAsync(),
        promiseS = subjectFile.readFileAsync();

    if (!formStatus.isValid) {
      throw new Error("Form variables should have been validated");
    }

    $.when(promiseQ, promiseS).done(function(queryLines, subjectLines) {
      try {
        var queryReader = new GEP.SeqReader(queryLines),
            subjectReader = new GEP.SeqReader(subjectLines),
            coordsErrors = [];

        querySeq = queryReader.getRecord();
        subjectSeq = subjectReader.getRecord();

        querySeq.coords = validateCoordinateSet("queryCoords", coordsErrors, {
          label: "Query Color Boundaries",
          maxValue: querySeq.getLength()
        });

        subjectSeq.coords = validateCoordinateSet("subjectCoords", coordsErrors, {
          label: "Subject Color Boundaries",
          maxValue: subjectSeq.getLength()
        });

        if (coordsErrors.length > 0) {
          showError(coordsErrors);
        } else {
          drawDotPlot(formStatus.clean);
        }

      } catch(error) {
        showError(error);
      }

    }).fail(function (error) {
      showError(error);
    });
  }

  function createDotPlot() {
    showWait();

    var formStatus = verifyFormParameters();

    if (!formStatus.isValid) {
      showError(formStatus.message);
      return;
    }

    if ((!dotplot) && (!hasRemoteData)) {
      loadSequenceFilesAsync(formStatus);
    } else {
      drawDotPlot(formStatus.clean);
    }
  }

  function handleFormSubmit(e) {
    e.stopPropagation();
    e.preventDefault();

    try {
      dotplot = null;
      createDotPlot();

    } catch (error) {
      showError(error);
    }

    return false;
  }

  function configureForm() {
    if (hasRemoteData) {
      getById("sequences-fieldset").hide();
      getById("colorBoundaries-fieldset").hide();
    }

    getById("uploadForm").on("submit", handleFormSubmit);
  }

  function loadRemoteSequenceData(dataUrl) {
    showWait("Retrieving sequence data...");

    var formStatus = verifyFormParameters(),
        request = $.getJSON(dataUrl);

    request.done(function(data) {
      try {
        querySeq = new GEP.SeqRecord(data.query);
        subjectSeq = new GEP.SeqRecord(data.subject);

        drawDotPlot(formStatus.clean);

      } catch (error) {
        showError(error);
      }
    });

    request.fail(function(jqXHR) {
      showError("Cannot retrieve sequence data: " +
                jqXHR.status + ", " + jqXHR.statusText);
    });
  }

  function main() {
    if (!verifyBrowserCapabilities()) {
      return;
    }

    var params = GEP.util.parseGetParameters(window.location.search);

    hasRemoteData = (params.dataUrl !== undefined);

    if (hasRemoteData) {
      loadRemoteSequenceData(params.dataUrl);
    }

    configureForm();
  }

  main();

}(jQuery));
