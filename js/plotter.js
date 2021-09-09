/*global jQuery */
(function($) {
  "use strict";

  var GEP = $.fn.GEP,

  Plotter = (function () {
    var defaults = {
      numFieldsPerPixel: 4,
      font: "12px Arial, Sans-serif",
      maxRGB: 255,
      cutoff: 1,
      padding: 75,
      size: 750,
      axisCfg: { padding: 75 },
      regionCfg: { padding: 75 },
      strokeStyle: "black",
      fillStyle: "black"
    };

    function Plotter(canvasId, cfg) {
      this.settings = GEP.util.mergeConfig(defaults, cfg);

      this.canvas = GEP.util.getElementById(canvasId);

      this.canvas.width = this.settings.size;
      this.canvas.height = this.settings.size;

      this.canvas.style.width = this.settings.size + "px";
      this.canvas.style.height = this.settings.size + "px";

      this.ctx = this.canvas.getContext('2d');
      this.ctx.font = this.settings.font;
      this.ctx.strokeStyle = this.settings.strokeStyle;
      this.ctx.fillStyle = this.settings.fillStyle;

      this.scale = { x: 1.0, y: 1.0 };
    }

    Plotter.prototype.drawDotPlot = function(lines) {
      var padding = this.settings.padding,
          scaleX = this.scale.x,
          scaleY = this.scale.y,
          numLines = lines.length,
          originY = this.canvas.height - padding,
          lineInfo, start, end, i;

      this.ctx.beginPath();

      for (i = 0; i < numLines; i += 1) {
        lineInfo = lines[i];

        start = lineInfo.start;
        end = lineInfo.end;

        this.ctx.moveTo(start.x * scaleX + padding,
                        originY - (start.y * scaleY));

        this.ctx.lineTo(end.x * scaleX + padding,
                        originY - (end.y * scaleY));

      }

      this.ctx.stroke();
    };

    Plotter.prototype.drawAxis = function(matcher) {
      var axis = new GEP.Axis(this.canvas, this.settings.axisCfg);

      axis.draw({ scale: this.scale, matcher: matcher });
    };

    Plotter.prototype.drawFrame = function() {
      var padding = this.settings.padding,
          margin = 2 * padding,
          dim = this.getActualSize();

      this.ctx.strokeRect(padding, padding, dim.width - margin, dim.height - margin);
    };

    Plotter.prototype.drawRegions = function(matcher) {
      var colorRegion = new GEP.ColorRegion(this.canvas, this.settings.regionCfg);

      colorRegion.draw({ matcher: matcher, scale: this.scale });
    };

    Plotter.prototype.draw = function(matcher, matches) {
      var canvasElement = $(this.canvas);

      canvasElement.hide();

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.scale = this.calcScale(matcher);

      this.drawFrame();
      this.drawAxis(matcher);
      this.drawDotPlot(matches);

      if (matcher.hasRegions()) {
        this.drawRegions(matcher);
      }

      canvasElement.show();
    };

    Plotter.prototype.calcScale = function(matcher) {
      var dotplotSize = this.getDotPlotSize();

      return {
        x: dotplotSize.width / matcher.getQueryLength(),
        y: dotplotSize.height / matcher.getSubjectLength()
      };
    };

    Plotter.prototype.getDotPlotSize = function() {
      var actualSize = this.getActualSize(),
          margin = 2 * this.settings.padding;

      return {
        width: actualSize.width - margin,
        height: actualSize.height - margin
      };
    };

    Plotter.prototype.getActualSize = function() {
      return {
        width: this.parseDimensionString(this.canvas.style.width),
        height: this.parseDimensionString(this.canvas.style.height)
      };
    };

    Plotter.prototype.setActualSize = function(size) {
      size = size || this.settings.size;

      this.width = size;
      this.height = size;

      this.canvas.style.width = size + "px";
      this.canvas.style.height = size + "px";
    };

    Plotter.prototype.parseDimensionString = function(str) {
      var m = str.match(/^(\d+)/);

      if (m) {
        return parseInt(m[1], 10);
      }

      throw new Error("Invalid dimension string: " + str);
    };

    return Plotter;
  }());

  GEP.Plotter = Plotter;
}(jQuery));
