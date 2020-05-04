var Component = require("montage/ui/component").Component,
    d3 = require("d3"),
    DataSeries = require("montage-charts/logic/model/data-series").DataSeries;

/**
 * @class Main
 * @extends Component
 */
exports.Main = Component.specialize(/** @lends Main.prototype */{

    constructor: {
        value: function Main() {
            this.dataSeries = [];
        }
    },

    COLOR_PALETTE: {
        value: d3.scaleOrdinal(d3.schemeCategory10)
    },

    enterDocument: {
        value: function (isFirstTime) {
            if (isFirstTime) {
                this.addDataSeries();
            }
        }
    },

    handleRandomizeDataButtonAction: {
        value: function (event) {
            this.randomizeData(event.target.dataSeries);
        }
    },

    randomizeData: {
        value: function (dataSeries) {
            var data = [],
                i;
            for (i = 0; i < 10; ++i) {
                data.push({
                    x: Number((Math.random() * 10).toFixed(2)),
                    y: Number((Math.random() * 10).toFixed(2))
                });
            }
            data.sort(function (a, b) {
                return a.x < b.x ? -1 : a.x > b.x ? 1 : 0;
            });
            dataSeries.data = data;
        }
    },

    handleRemoveDataSeriesButtonAction: {
        value: function (event) {
            this.dataSeries.delete(event.target.dataSeries);
        }
    },

    handleAddDataSeriesButtonAction: {
        value: function () {
            this.addDataSeries();
        }
    },

    addDataSeries: {
        value: function () {
            var dataSeries = new DataSeries();
            // dataSeries.defineColumn("x", {"<-": "x"});
            // dataSeries.defineColumn("y", {"<-": "y"});
            this.randomizeData(dataSeries);
            dataSeries.color = this.COLOR_PALETTE(this.dataSeries.length);
            this.dataSeries.push(dataSeries);
        }
    },

    timeData: {
        value: [
            {x: new Date(), y: 1},
            {x: new Date(Date.now() + 1000 * 60 * 60 * 24), y: 2},
            {x: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), y: 4},
            {x: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), y: 1},
            {x: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4), y: 5}
        ]
    }
});
