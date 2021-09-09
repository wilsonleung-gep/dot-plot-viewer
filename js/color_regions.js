/*global jQuery */
(function($) {
  "use strict";

  var GEP = $.fn.GEP,

  ColorRegion = (function () {
    var defaults = {
      padding: 75,
      xColors: ["rgba(200,0,0,0.15)", "rgba(0,0,200,0.15)"],
      yColors: ["rgba(255,165,0,0.15)", "rgba(84,255,159,0.15)"]
    };

    function ColorRegion(canvas, cfg) {
      this.settings = GEP.util.mergeConfig(defaults, cfg);

      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      this.canvasHeight = canvas.height;
      this.canvasWidth = canvas.width;
    }

    ColorRegion.prototype.fillXRects = function(startIdx, matcher, xScale) {
      var settings = this.settings,
          padding = settings.padding,

          coords = matcher.getQueryCoords() || [],
          numCoords = coords.length,
          queryLength = matcher.getQueryLength(),

          width,
          height = this.canvasHeight - padding * 2,
          x, x1, x2, i;

      this.ctx.fillStyle = this.settings.xColors[startIdx];

      for (i = startIdx; i < numCoords; i += 2) {
        x1 = coords[i];
        x2 = coords[i + 1] || queryLength;

        x = padding + (x1 * xScale);
        width = (x2 - x1) * xScale;

        this.ctx.fillRect(x, padding, width, height);
      }
    };

    ColorRegion.prototype.fillYRects = function(startIdx, matcher, yScale) {
      var settings = this.settings,
          padding = settings.padding,

          coords = matcher.getSubjectCoords() || [],
          numCoords = coords.length,
          subjectLength = matcher.getSubjectLength(),

          width = this.canvasWidth - padding * 2,
          height,
          yOffset = this.canvasHeight - padding,
          y, y1, y2, i;

      this.ctx.fillStyle = this.settings.yColors[startIdx];

      for (i = startIdx; i < numCoords; i += 2) {
        y1 = coords[i];
        y2 = coords[i + 1] || subjectLength;

        y = yOffset - (y2 * yScale);
        height = (y2 - y1) * yScale;

        this.ctx.fillRect(padding, y, width, height);
      }
    };

    ColorRegion.prototype.drawXRegions = function(regionCfg) {
      var xScale = regionCfg.scale.x,
          matcher = regionCfg.matcher;

      this.ctx.save();

      this.fillXRects(0, matcher, xScale);
      this.fillXRects(1, matcher, xScale);

      this.ctx.restore();
    };

    ColorRegion.prototype.drawYRegions = function(regionCfg) {
      var yScale = regionCfg.scale.y,
          matcher = regionCfg.matcher;

      this.ctx.save();

      this.fillYRects(0, matcher, yScale);
      this.fillYRects(1, matcher, yScale);

      this.ctx.restore();
    };


    ColorRegion.prototype.draw = function(regionCfg) {
      this.drawXRegions(regionCfg);
      this.drawYRegions(regionCfg);
    };

    return ColorRegion;
  }());

  GEP.ColorRegion = ColorRegion;
}(jQuery));
