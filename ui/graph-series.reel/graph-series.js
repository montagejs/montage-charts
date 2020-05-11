/**
 * @module "ui/charts/graph-series.reel"
 */
var Component = require("montage/ui/component").Component,
    d3 = require("d3");

/**
 * @class GraphSeries
 * @extends Component
 */
exports.GraphSeries = Component.specialize(/** @lends GraphSeries.prototype */{

    constructor: {
        value: function GraphSeries() {
            this.super();
            this.handleDataSeriesChange = this.handleDataSeriesChange.bind(this);
            this.addRangeAtPathChangeListener("dataSeries.data", this.handleDataSeriesChange);
            this.addPathChangeListener("dataSeries.color", this.handleDataSeriesChange);
            this.addPathChangeListener("dataSeries.pointColor", this.handleDataSeriesChange);
            this.addPathChangeListener("dataSeries.lineColor", this.handleDataSeriesChange);
            this.addPathChangeListener("dataSeries.pointRadius", this.handleDataSeriesChange);
            this.addPathChangeListener("dataSeries.lineWidth", this.handleDataSeriesChange);
            this._drawingX = this._drawingX.bind(this);
            this._drawingY = this._drawingY.bind(this);
            this._handleMouseoverPoint = this._handleMouseoverPoint.bind(this);
            this._handleMouseoutPoint = this._handleMouseoutPoint.bind(this);
        }
    },

    dataSeries: {
        get: function () {
            return this._dataSeries;
        },
        set: function (value) {
            if (value !== this._dataSeries) {
                if (value) {
                    if (!value.columns.has("x")) {
                        value.defineColumn("x", {"<-": "x"});
                    }
                    if (!value.columns.has("y")) {
                        value.defineColumn("y", {"<-": "y"});
                    }
                }
                this._dataSeries = value;
                this.needsDraw = true;
            }
        }
    },

    handleDataSeriesChange: {
        value: function () {
            this.needsDraw = true;
        }
    },

    xScale: {
        get: function () {
            return this._xScale;
        },
        set: function (value) {
            this._xScale = value;
            this.needsDraw = true;
        }
    },

    yScale: {
        get: function () {
            return this._yScale;
        },
        set: function (value) {
            this._yScale = value;
            this.needsDraw = true;
        }
    },

    willDraw: {
        value: function () {
            this._windowWidth = window.innerWidth;
            this._windowHeight = window.innerHeight;
        }
    },

    draw: {
        value: function () {
            var points;
            if (!this.dataSeries) {
                return;
            }
            points = d3.select(this.element)
                .selectAll(".GraphSeries-point")
                .data(this.dataSeries.data);
            points.enter()
                .append("circle")
                .attr("class", "GraphSeries-point")
                .attr("r", this.dataSeries.pointRadius)
                .attr("cx", this._drawingX)
                .attr("cy", this._drawingY)
                .attr("fill", this.dataSeries.pointColor)
                .on("mouseover", this._handleMouseoverPoint)
                .on("mouseout", this._handleMouseoutPoint);
            points
                .transition()
                .attr("r", this.dataSeries.pointRadius)
                .attr("cx", this._drawingX)
                .attr("cy", this._drawingY)
                .attr("fill", this.dataSeries.pointColor);
            points.exit().remove();
            d3.select(this.line)
                .datum(this.dataSeries.data)
                .transition()
                .attr("fill", "none")
                .attr("stroke", this.dataSeries.lineColor)
                .attr("stroke-width", this.dataSeries.lineWidth)
                .attr("pointer-events", "none")
                .attr("d", d3.line().x(this._drawingX).y(this._drawingY));
        }
    },

    _drawingX: {
        value: function (datum) {
            return this.xScale ? this.xScale(this.dataSeries.columns.get('x').getValue(datum)) : 0;
        }
    },

    _drawingY: {
        value: function (datum) {
            return this.yScale ? this.yScale(this.dataSeries.columns.get('y').getValue(datum)) : 0;
        }
    },

    _handleMouseoverPoint: {
        value: function (dataPoint, index, elements) {
            var growX = d3.event.offsetX > this.boundingClientRect.width / 2 ? "left" : "right",
                growY = d3.event.offsetY > this.boundingClientRect.height / 2 ? "up" : "down",
                translateX = growX === "left" ? "-100%" : "10px",
                translateY = growY === "up" ? "-100%" : "15px",
                maxWidth = growX === "left" ? d3.event.pageX - this.boundingClientRect.x : this.boundingClientRect.x + this.boundingClientRect.width - d3.event.pageX,
                maxHeight = growY === "up" ? d3.event.pageY - this.boundingClientRect.y : this.boundingClientRect.y + this.boundingClientRect.height - d3.event.pageY;
            if (this.tooltip && this.tooltip.element) {
                d3.select(this.tooltipContainer)
                    .style("left", d3.event.pageX + "px")
                    .style("top", d3.event.pageY + "px")
                    .style("max-width", maxWidth + "px")
                    .style("max-height", maxHeight + "px")
                    .style("transform", "translate(" + translateX + "," + translateY + ")")
                    .style("pointer-events", "all");
                d3.select(this.tooltip.element)
                    .classed("Graph-tooltip--visible", true)
                this.tooltip.datum = dataPoint;
                this.tooltip.index = index;
            }
        }
    },

    _handleMouseoutPoint: {
        value: function (dataPoint, index, elements) {
            if (this.tooltip && this.tooltip.element) {
                d3.select(this.tooltipContainer)
                    .style("pointer-events", "none");
                d3.select(this.tooltip.element)
                    .classed("Graph-tooltip--visible", false)
            }
        }
    }
});
