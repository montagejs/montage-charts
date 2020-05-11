/**
 * @module "ui/legend-item.reel"
 */
var Component = require("montage/ui/component").Component,
    d3 = require("d3");

/**
 * @class LegendItem
 * @extends Component
 */
exports.LegendItem = Component.specialize(/** @lends LegendItem.prototype */{

    constructor: {
        value: function LegendItem() {
            this.super();
            this.addPathChangeListener("dataSeries.name", this, "requestDraw");
            this.addPathChangeListener("dataSeries.color", this, "requestDraw");
            this.addPathChangeListener("dataSeries.pointColor", this, "requestDraw");
            this.addPathChangeListener("dataSeries.lineColor", this, "requestDraw");
        }
    },

    requestDraw: {
        value: function () {
            this.needsDraw = true;
        }
    },

    draw: {
        value: function () {
            var icon;
            if (!this.dataSeries) {
                return
            }
            icon = d3.select(this.icon);
            icon.selectAll("line").remove();
            icon.append("line")
                .attr("x1", 0)
                .attr("x2", 16)
                .attr("y1", 8)
                .attr("y2", 8)
                .attr("stroke-width", 2)
                .attr("stroke", this.dataSeries.lineColor);
            icon.selectAll("circle").remove();
            icon.append("circle")
                .attr("cx", 8)
                .attr("cy", 8)
                .attr("r", 4)
                .style("fill", this.dataSeries.pointColor);
        }
    }
});
