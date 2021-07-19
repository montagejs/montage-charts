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
            return this._marginBottom || (this.xAxisLabel ? 50 : 15);
        },
        set: function (value) {
            this._marginBottom = value;
            this.needsDraw = true;
        }
    },

    marginLeft: {
        get: function () {
            return this._marginLeft || (this.yAxisLabel ? 50 : 15);
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

    /**
     * Whether to draw visible gridlines instead of ticks on the axes.
     * @type {Boolean}
     */
    shouldDrawGridlines: {
        value: false
    },

    /**
     * Whether the x axis tick lines/labels should only consist of integer values.
     * values.
     * @type {Boolean}
     */
    shouldUseIntegerXTicks: {
        value: false
    },

    /**
     * Whether the x axis tick lines/labels should only consist of integer values.
     * values.
     * @type {Boolean}
     */
    shouldUseIntegerYTicks: {
        value: false
    },

    constructor: {
        value: function Graph() {
            this.requestDraw = this.requestDraw.bind(this);
            this.handleResize = this.handleResize.bind(this);
            this.defineBinding("_dataDomain", {"<-": "[dataSeries.map{columns.get('x').min}.min(), dataSeries.map{columns.get('x').max}.max()]"});
            this.defineBinding("_dataRange", {"<-": "[dataSeries.map{columns.get('y').min}.min(), dataSeries.map{columns.get('y').max}.max()]"});
            this.addRangeAtPathChangeListener("domain", this.requestDraw);
            this.addRangeAtPathChangeListener("range", this.requestDraw);
            this.defineBinding("_dataDomainType", {"<-": "dataSeries.0.columns.get('x').type"});
            this.defineBinding("_dataRangeType", {"<-": "dataSeries.0.columns.get('y').type"});
            this.addPathChangeListener("domainType", this.requestDraw);
            this.addPathChangeListenerr("rangeType", this.requestDraw);

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

    domain: {
        get: function () {
            return this._domain || this._dataDomain;
        },
        set: function (value) {
            if (value !== this._domain) {
                this._domain = value;
            }
        }
    },

    range: {
        get: function () {
            return this._range || this._dataRange;
        },
        set: function (value) {
            if (value !== this._range) {
                this._range = value;
            }
        }
    },

    domainType: {
        get: function () {
            return this._domainType || this._dataDomainType;
        },
        set: function (value) {
            if (value !== this._domainType) {
                this._domainType = value;
            }
        }
    },

    rangeType: {
        get: function () {
            return this._rangeType || this._datarangeType;
        },
        set: function (value) {
            if (value !== this._rangeType) {
                this._rangeType = value;
            }
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
            var axes = this._buildAxes();
            d3.select(this.xAxisElement)
                .transition()
                .attr("transform", "translate(0," + this._height + ")")
                .call(axes.x);
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
                .call(axes.y);
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

    _buildAxes: {
        value: function () {
            var x = d3.axisBottom(this._xScale),
                y = d3.axisLeft(this._yScale);
            x = this.shouldDrawGridlines ? x.tickSize(-this._height).tickPadding(6).tickSizeOuter(0) : x;
            y = this.shouldDrawGridlines ? y.tickSize(-this._width).tickPadding(6).tickSizeOuter(0) : y;
            x = this.shouldUseIntegerXTicks ? x.tickValues(this._xScale.ticks().filter(Number.isInteger)).tickFormat(d3.format("d")) : x;
            y = this.shouldUseIntegerYTicks ? y.tickValues(this._yScale.ticks().filter(Number.isInteger)).tickFormat(d3.format("d")) : y;
            return {x: x, y: y};
        }
    },

    _buildScales: {
        value: function () {
            var xScale = (this.domainType === "time") ? d3.scaleTime() : d3.scaleLinear(),
                yScale = (this.rangeType === "time") ? d3.scaleTime() : d3.scaleLinear();
            this._xScale = xScale.domain(this.domain).range([0, this._width]);
            this._yScale = yScale.domain(this.range).range([this._height, 0]);
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
