/*global jQuery */
(function($) {
  "use strict";

  var GEP = $.fn.GEP,

  Axis = (function () {
    var defaults = {
      padding: 75,
      fontCfg: {
        fontName: "Arial, Sans-serif",
        title: 28,
        axis: 20,
        marker: 14
      },
      labels: {
        x: "Query",
        y: "Subject"
      },
      labelOffsets: {
        x: 15,
        y: 20
      },
      maxNumMarkers: 10,
      markerSizes: [1, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 50000, 100000],
      markerDrawLength: 10
    };

    function Axis(canvas, cfg) {
      this.settings = GEP.util.mergeConfig(defaults, cfg);

      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      this.canvasHeight = canvas.height;
      this.canvasWidth = canvas.width;
    }

    Axis.prototype.getFontSpec = function(fontSize, fontName) {
      fontName = fontName || this.settings.fontCfg.fontName;

      return fontSize + "px " + fontName;
    };

    // https://stackoverflow.com/questions/20551534/
    Axis.prototype.calcFont = function(text, maxSize, fontSize, fontName) {
      var textSize,
          stepSize = 2;

      this.ctx.font = this.getFontSpec(fontSize, fontName);
      textSize = this.ctx.measureText(text).width;

      while (textSize > maxSize) {
        fontSize -= stepSize;

        this.ctx.font = this.getFontSpec(fontSize, fontName);
        textSize = this.ctx.measureText(text).width;
      }

      return fontSize + "px " + fontName;
    };

    Axis.prototype.getTitle = function(matcher) {
      return matcher.getQueryId() + " vs. " + matcher.getSubjectId();
    };

    Axis.prototype.drawTitle = function(matcher) {
      var ctx = this.ctx,
          settings = this.settings,
          xoffset = settings.labelOffsets.x,
          title = this.getTitle(matcher),
          font;

      font = this.calcFont(title, this.canvasWidth, settings.fontCfg.title);

      ctx.save();

      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(title, this.canvasWidth / 2.0, xoffset);

      ctx.restore();
    };

    Axis.prototype.drawAxisLabels = function(matcher) {
      var ctx = this.ctx,
          settings = this.settings,
          labelOffsets = settings.labelOffsets,
          xLabel = matcher.getQueryId(),
          yLabel = matcher.getSubjectId(),
          font;

      ctx.save();
      font = this.calcFont(xLabel, this.canvasWidth, settings.fontCfg.axis);
      ctx.font = font;
      ctx.textAlign = "center";

      ctx.save();
      font = this.calcFont(yLabel, this.canvasHeight, settings.fontCfg.axis);
      ctx.font = font;

      ctx.translate(labelOffsets.y, this.canvasHeight / 2.0);
      ctx.rotate(Math.PI * -0.5);
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();

      ctx.fillText(xLabel, this.canvasWidth / 2.0,
                   this.canvasHeight - labelOffsets.x);

      ctx.restore();
    };

    Axis.prototype.calcMarkerSize = function(seqLength) {
      var maxNumMarkers = this.settings.maxNumMarkers,
          markerSizes = this.settings.markerSizes,
          numMarkerSizes = markerSizes.length,
          targetSize, markerSize, i;

      targetSize = seqLength / maxNumMarkers;

      for (i = 0; i < numMarkerSizes; i += 1) {
        markerSize = markerSizes[i];

        if (markerSize > targetSize) {
          break;
        }
      }

      return {
        count: Math.floor(seqLength / markerSize),
        size: markerSize
      };
    };

    Axis.prototype.drawXmarkers = function(axisCfg) {
      var matcher = axisCfg.matcher,
          settings = this.settings,
          padding = settings.padding,
          markerDrawLength = settings.markerDrawLength,

          xScale = axisCfg.scale.x,
          xLength = matcher.getQueryLength(),
          markersInfo = this.calcMarkerSize(xLength),
          markerSize = markersInfo.size,

          ctx = this.ctx,
          label = markerSize,
          i = 1,
          x, y;

      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      y = this.canvasHeight - padding;

      while (label < xLength) {
        x = padding + (label * xScale);

        ctx.beginPath();
        ctx.moveTo(x, y + markerDrawLength);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.fillText(label, x, y + markerDrawLength);

        i += 1;
        label = markerSize * i;
      }
    };

    Axis.prototype.drawYmarkers = function(axisCfg) {
      var matcher = axisCfg.matcher,
          settings = this.settings,
          padding = settings.padding,
          markerDrawLength = settings.markerDrawLength,

          yScale = axisCfg.scale.y,
          yLength = matcher.getSubjectLength(),
          markersInfo = this.calcMarkerSize(yLength),
          markerSize = markersInfo.size,
          yOffset = this.canvasHeight - padding,

          ctx = this.ctx,
          i = 1,
          label = markerSize,
          x, y;

      ctx.textBaseline = "middle";
      ctx.textAlign = "right";

      x = padding;

      while (label < yLength) {
        y = yOffset - (label * yScale);

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - markerDrawLength, y);
        ctx.stroke();

        ctx.fillText(label, padding - markerDrawLength, y);

        i += 1;
        label = markerSize * i;
      }
    };

    Axis.prototype.drawMarkers = function(axisCfg) {
      var ctx = this.ctx,
          font = this.getFontSpec(this.settings.fontCfg.marker);

      ctx.save();

      ctx.font = font;

      this.drawYmarkers(axisCfg);
      this.drawXmarkers(axisCfg);

      ctx.restore();
    };

    Axis.prototype.draw = function(axisCfg) {
      var matcher = axisCfg.matcher;

      this.drawTitle(matcher);
      this.drawAxisLabels(matcher);
      this.drawMarkers(axisCfg);
    };

    return Axis;
  }());

  GEP.Axis = Axis;
}(jQuery));
