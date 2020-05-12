/**
 * @module ui/chart.reel
 */
var Component = require("montage/ui/component").Component,
    d3 = require('d3');

/**
 * @class Graph
 * @extends Component
 */
exports.Graph = Component.specialize( /** @lends Graph# */ {

    /**
     * @type {String}
     */
    title: {
        value: null
    },

    /**
     * @type {"left" | "middle" | "right"}
     * @default "middle"
     */
    titlePosition: {
        get: function () {
            return this._titlePosition || "middle";
        },
        set: function (value) {
            this._titlePosition = value;
            this.needsDraw = true;
        }
    },

    dataSeries: {
        get: function () {
            return this._dataSeries || [];
        },
        set: function (value) {
            this._dataSeries = value;
        }
    },

    marginTop: {
        get: function () {
            return this._marginTop || 0;
        },
        set: function (value) {
            this._marginTop = value;
            this.needsDraw = true;
        }
    },

    marginBottom: {
        get: function () {
            return this._marginBottom || 50;
        },
        set: function (value) {
            this._marginBottom = value;
            this.needsDraw = true;
        }
    },

    marginLeft: {
        get: function () {
            return this._marginLeft || 50;
        },
        set: function (value) {
            this._marginLeft = value;
            this.needsDraw = true;
        }
    },

    marginRight: {
        get: function () {
            return this._marginRight || 0;
        },
        set: function (value) {
            this._marginRight = value;
            this.needsDraw = true;
        }
    },

    /**
     * Whether to show a legend. The default value (null) causes the legend to
     * be shown only when this graph has more than one data series.
     * @type {null | true | false}
     */
    showLegend: {
        value: null
    },

    constructor: {
        value: function Graph() {
            this.requestDraw = this.requestDraw.bind(this);
            this.handleResize = this.handleResize.bind(this);
            this.defineBinding("domain", {"<-": "[dataSeries.map{columns.get('x').min}.min(), dataSeries.map{columns.get('x').max}.max()]"});
            this.defineBinding("range", {"<-": "[dataSeries.map{columns.get('y').min}.min(), dataSeries.map{columns.get('y').max}.max()]"});
            this.addRangeAtPathChangeListener("domain", this.requestDraw);
            this.addRangeAtPathChangeListener("range", this.requestDraw);
            this.defineBinding("domainType", {"<-": "dataSeries.0.columns.get('x').type"});
            this.defineBinding("rangeType", {"<-": "dataSeries.0.columns.get('y').type"});
            this.addPathChangeListener("domainType", this.requestDraw);
            this.addPathChangeListener("rangeType", this.requestDraw);

            // The following listeners are expressions that (may) cause the
            // title or legend to show/hide, which (may) change the dimensions
            // of the svg and require a draw.
            // We listen with handleResize instead of requestDraw to allow
            // the DOM to reflow the other elements first, ensuring that when
            // we draw we will have an accurate bounding client rect.
            this.addRangeAtPathChangeListener("dataSeries", this.handleResize);
            this.addPathChangeListener("showLegend", this.handleResize);
            this.addPathChangeListener("title.defined() && title.length > 0", this.handleResize);
        }
    },

    requestDraw: {
        value: function () {
            this.needsDraw = true;
        }
    },

    enterDocument: {
        value: function () {
            if (typeof ResizeObserver !== "undefined") {
                this._resizeObserver = new ResizeObserver(this.handleResize);
                this._resizeObserver.observe(this.element);
            } else if (typeof window !== "undefined") {
                window.addEventListener("resize", this.handleResize);
            }
        }
    },

    handleResize: {
        value: function () {
            this._requestDrawTimeout && clearTimeout(this._requestDrawTimeout);
            this._requestDrawTimeout = setTimeout(this.requestDraw, 250);
        }
    },

    exitDocument: {
        value: function () {
            if (typeof ResizeObserver !== "undefined" && this._resizeObserver) {
                this._resizeObserver.disconnect();
            } else if (typeof window !== "undefined") {
                window.removeEventListener("resize", this.handleWindowResize);
            }
        }
    },

    willDraw: {
        value: function () {
            this._boundingClientRect = this.svg.getBoundingClientRect();
            this._width = this._boundingClientRect.width - this.marginLeft - this.marginRight;
            this._height = this._boundingClientRect.height - this.marginTop - this.marginBottom;
        }
    },

    draw: {
        value: function () {
            d3.select(this.view)
                .attr("width", this._width)
                .attr("height", this._height)
                .attr("transform", "translate(" + this.marginLeft + "," + this.marginTop + ")");
            this._buildScales();
            this._drawAxes();
        }
    },

    _drawAxes: {
        value: function () {
            var xAxis = d3.axisBottom(this._xScale),
                yAxis = d3.axisLeft(this._yScale);
            d3.select(this.xAxisElement)
                .transition()
                .attr("transform", "translate(0," + this._height + ")")
                .call(xAxis);
            if (this.xAxisLabel) {
                d3.select(this.xAxisLabelElement)
                    .transition()
                    .attr("x", this._width / 2)
                    .attr("y", this._height + 3 * this.marginBottom / 4)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "12")
                    .text(this.xAxisLabel);
            }
            d3.select(this.yAxisElement)
                .transition()
                .call(yAxis);
            if (this.yAxisLabel) {
                d3.select(this.yAxisLabelElement)
                    .transition()
                    .attr("x", -this._height / 2)
                    .attr("y", 20 - this.marginLeft)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "12")
                    .attr("transform", "rotate(-90)")
                    .text(this.yAxisLabel);
            }
        }
    },

    _buildScales: {
        value: function () {
            var xScale = (this.domainType === "time") ? d3.scaleTime() : d3.scaleLinear(),
                yScale = (this.rangeType === "time") ? d3.scaleTime() : d3.scaleLinear();
            this._xScale = xScale.domain(this._padExtent(this.domain)).range([0, this._width]);
            this._yScale = yScale.domain(this._padExtent(this.range)).range([this._height, 0]);
        }
    },

    _padExtent: {
        value: function (extent) {
            var min = isNaN(extent[0]) ? 0 : +extent[0],
                max = isNaN(extent[1]) ? 1 : +extent[1],
                buffer = (max - min) * 0.05;
            return [
                (min > 0 && min < buffer) ? 0 : (min - buffer),
                (max < 0 && max > -buffer) ? 0 : (max + buffer)
            ];
        }
    }
});
