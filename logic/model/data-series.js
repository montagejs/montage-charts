var Target = require("montage/core/target").Target,
    parse = require("frb/parse"),
    evaluate = require("frb/evaluate"),
    Map = require("collections/map");

var Column = Target.specialize({

    constructor: {
        value: function Column() {
            this.defineBinding("values", {"<-": "data.map{^this.getValue(this)}"});
            this.defineBinding("type", {"<-": "values.0", convert: this._typeOf});
            this.defineBinding("min", {"<-": "values.min()"});
            this.defineBinding("max", {"<-": "values.max()"});
        }
    },

    /**
     * @type {Array}
     */
    data: {
        value: null
    },

    /**
     * @type {Array}
     */
    values: {
        value: null
    },

    /**
     * @type {String}
     */
    type: {
        value: undefined
    },

    /**
     * @type {Number}
     */
    min: {
        value: undefined
    },

    /**
     * @type {Number}
     */
    max: {
        value: undefined
    },

    /**
     * @type {String}
     */
    expression: {
        get: function () {
            return this._expression;
        },
        set: function (value) {
            var parsed;
            if (value !== this._expression) {
                this._expression = value;
                if (value) {
                    if (typeof value === "string") {
                        parsed = parse(value);
                    }
                    if (this._isProperty(parsed)) {
                        this._property = parsed.args[1].value;
                    } else {
                        this._property = null;
                    }
                } else {
                    this._property = null;
                }
            }
        }
    },

    _isProperty: {
        value: function (parsedExpression) {
            return parsedExpression != null &&
                parsedExpression.type === "property" &&
                parsedExpression.args &&
                parsedExpression.args.length === 2 &&
                parsedExpression.args[0].type === "value" &&
                parsedExpression.args[1].type === "literal";
        }
    },

    getValue: {
        value: function (datum) {
            if (!datum) {
                return undefined;
            } else if (this._property) {
                return this._property in datum ? datum[this._property] : null;
            } else if (this.expression) {
                return evaluate(this.expression, datum);
            } else if (this.name) {
                return datum[this.name];
            }
        }
    },

    _typeOf: {
        value: function (value) {
            return value != null ? value.constructor.name : undefined;
        }
    }
});

/**
 * A single set of data to be plotted on a chart.
 *
 * The DataSeries contains the data to be plotted, instructions on how to read
 * that data, and styling attributes that tweak how the plotted data will be
 * rendered.
 *
 * The data is an arbitrary array with no initial knowledge of its structure.
 * The DataSeries should be informed of the data's structure using
 * {@link #defineColumn}. This allows the DataSeries to be used in various
 * different types of charts, each of which may expect to find different
 * columns on the data it plots.
 */
exports.DataSeries = Target.specialize({

    /**
     * An arbitrary array of data points. The items in the array may have any
     * desired shape and type. Each datapoint is given meaning by defining
     * columns on the data series. See {@link #defineColumn}.
     * @type {Array}
     */
    data: {
        get: function () {
            if (!this._data) {
                this._data = [];
            }
            return this._data;
        },
        set: function (value) {
            this._data = value;
        }
    },

    /**
     * Defines a data column, which maps properties/expressions from data.
     *
     * Columns are how the DataSeries assigns meaning to {@link #data}. Once
     * the column has been defined, it can be used to extract information about
     * information on each of the data points.
     *
     * @see {@link DataSeries.Column}
     * @example
     * var dataSeries = new DataSeries();
     * dataSeries.data = [{a: 1}, {a: 2}];
     * dataSeries.defineColumn("halfA", {"<-": "a/2"});
     * var halfAColumn = dataSeries.columns.get("halfA");  // will now be defined
     * halfAColumn.type  // "Number"
     * halfAColumn.max  // 1
     * @returns {DataSeries.Column}
     */
    defineColumn: {
        value: function (name, binding) {
            var column = this.columns.get(name) || new Column(),
                expression = binding["<-"] || binding["<->"];
            column.name = name;
            column.expression = expression;
            if (!column.getBinding("data")) {
                column.defineBinding("data", {"<-": "data", source: this});
            }
            if (!this.columns.has(name)) {
                this.columns.set(name, column);
            }
            return column;
        }
    },

    /**
     * A map of defined data columns. This map should not be written to
     * directly. Use {@link #defineColumn} instead.
     * @type {Map<DataSeries.Column>}
     * @readonly
     */
    columns: {
        get: function () {
            if (!this._columns) {
                this._columns = new Map();
            }
            return this._columns;
        }
    },

    deserializeSelf: {
        value: function (deserializer) {
            var self = this,
                columns = deserializer.getProperty("columns");
            if (columns && typeof columns === "object") {
                Object.keys(columns).forEach(function (key) {
                    self.defineColumn(key, columns[key]);
                });
            }
            return self;
        }
    },

    //
    // Style Properties
    //

    color: {
        get: function () {
            return this._color || "steelblue";
        },
        set: function (value) {
            this._color = value;
        }
    },

    pointColor: {
        get: function () {
            return this._pointColor || this.color;
        },
        set: function (value) {
            this._pointColor = value;
        }
    },

    lineColor: {
        get: function () {
            return this._lineColor || this.color;
        },
        set: function (value) {
            this._lineColor = value;
        }
    },

    pointRadius: {
        get: function () {
            return this._pointRadius || 3;
        },
        set: function (value) {
            this._pointRadius = value;
        }
    },

    lineWidth: {
        get: function () {
            return this._lineWidth || 1.5;
        },
        set: function (value) {
            this._lineWidth = value;
        }
    },
}, {
    Column: {
        value: Column
    }
});
