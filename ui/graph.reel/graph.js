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
        get: function () {
            return this._title;
        },
        set: function (value) {
            this._title = value;
            this.needsDraw = true;
        }
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
            return this._marginTop || 30;
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
            return this._marginRight || 10;
        },
        set: function (value) {
            this._marginRight = value;
            this.needsDraw = true;
        }
    },

    constructor: {
        value: function Graph() {
            this.requestDraw = this.requestDraw.bind(this);
            this.handleWindowResize = this.handleWindowResize.bind(this);
            this.defineBinding("domain", {"<-": "[dataSeries.map{columns.get('x').min}.min(), dataSeries.map{columns.get('x').max}.max()]"});
            this.defineBinding("range", {"<-": "[dataSeries.map{columns.get('y').min}.min(), dataSeries.map{columns.get('y').max}.max()]"});
            this.addRangeAtPathChangeListener("domain", this.requestDraw);
            this.addRangeAtPathChangeListener("range", this.requestDraw);
            this.defineBinding("domainType", {"<-": "dataSeries.0.columns.get('x').type"});
            this.defineBinding("rangeType", {"<-": "dataSeries.0.columns.get('y').type"});
            this.addPathChangeListener("domainType", this.requestDraw);
            this.addPathChangeListener("rangeType", this.requestDraw);
        }
    },

    requestDraw: {
        value: function () {
            this.needsDraw = true;
        }
    },

    enterDocument: {
        value: function () {
            if (typeof window !== "undefined") {
                window.addEventListener("resize", this.handleWindowResize);
            }
        }
    },

    handleWindowResize: {
        value: function () {
            this._requestDrawTimeout && clearTimeout(this._requestDrawTimeout);
            this._requestDrawTimeout = setTimeout(this.requestDraw, 250);
        }
    },

    exitDocument: {
        value: function () {
            if (typeof window !== "undefined") {
                window.removeEventListener("resize", this.handleWindowResize);
            }
        }
    },

    willDraw: {
        value: function () {
            this._boundingClientRect = this.element.getBoundingClientRect();
            this._width = this._boundingClientRect.width - this.marginLeft - this.marginRight;
            this._height = this._boundingClientRect.height - this.marginTop - this.marginBottom;
        }
    },

    draw: {
        value: function () {
            d3.select(this.svg)
                .attr("width", this._width + this.marginLeft + this.marginRight)
                .attr("height", this._height + this.marginTop + this.marginBottom);
            d3.select(this.view)
                .attr("transform", "translate(" + this.marginLeft + "," + this.marginTop + ")");
            this._drawTitle();
            this._drawAxes();
        }
    },

    _drawTitle: {
        value: function () {
            var title;
            if (this.title) {
                title = d3.select(this.titleElement)
                    .transition()
                    .attr("y", 0 - (this.marginTop / 2))
                    .attr("font-size", "20")
                    .text(this.title);
                switch (this.titlePosition) {
                    default:
                    case "left":
                        title.attr("x", 0).attr("text-anchor", "start");
                        break;
                    case "center":
                        title.attr("x", this._width / 2).attr("text-anchor", "middle");
                        break;
                    case "right":
                        title.attr("x", this._width).attr("text-anchor", "end");
                        break;
                }
            }
        }
    },

    _drawAxes: {
        value: function () {
            var xAxis, yAxis;
            this._buildScales();
            xAxis = d3.axisBottom(this._xScale);
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
                    .attr("font-size", "10")
                    .text(this.xAxisLabel);
            }
            yAxis = d3.axisLeft(this._yScale);
            d3.select(this.yAxisElement)
                .transition()
                .call(yAxis);
            if (this.yAxisLabel) {
                d3.select(this.yAxisLabelElement)
                    .attr("x", -this._height / 2)
                    .attr("y", 20 - this.marginLeft)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "10")
                    .attr("transform", "rotate(-90)")
                    .text(this.yAxisLabel);
            }
        }
    },

    _buildScales: {
        value: function () {
            var xScale = (this.domainType === "Date" || this.domainType === "Moment") ? d3.scaleTime() : d3.scaleLinear(),
                yScale = (this.rangeType === "Date" || this.rangeType === "Moment") ? d3.scaleTime() : d3.scaleLinear();
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
