var DataSeries = require("montage-charts/logic/model/data-series").DataSeries,
    frb = require("frb"),
    Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer;

describe("DataSeries", function () {
    var dataSeries;

    describe("Column", function () {
        var column;

        it("uses its own name as the property key by default", function () {
            column = new DataSeries.Column();
            column.name = "x";
            expect(column.getValue({x: 15})).toBe(15);
        });

        it("uses the specified property key", function () {
            column = new DataSeries.Column();
            column.expression = "foo";
            expect(column.getValue({foo: 15})).toBe(15);
        });

        it("evaluates the specified FRB expression", function () {
            column = new DataSeries.Column();
            column.expression = "foo.map{a}.sum()";
            expect(column.getValue({
                foo: [{a: 1}, {a: 3}]
            })).toBe(4);
        });

        describe("type", function () {
            it("is undefined without data", function () {
                column = new DataSeries.Column();
                column.expression = "foo";
                expect(column.type).toEqual(undefined);
            });

            it("is 'Number' for numbers", function () {
                column = new DataSeries.Column();
                column.expression = "foo";
                column.data = [{foo: 1}];
                expect(column.type).toEqual("Number");
            });

            it("is 'Date' for dates", function () {
                column = new DataSeries.Column();
                column.expression = "foo";
                column.data = [{foo: new Date()}];
                expect(column.type).toEqual("Date");
            });

            it("is bindable", function () {
                column = new DataSeries.Column();
                column.expression = "foo";
                column.data = [{foo: 1}];
                var o = frb.defineBinding({}, "type", {"<-": "type", source: column});
                expect(o.type).toEqual("Number");
                column.data = [{foo: new Date()}];
                expect(o.type).toEqual("Date");
            });
        });

        describe("min", function () {
            it("is undefined without data", function () {
                column = new DataSeries.Column();
                column.expression = "foo";
                expect(column.min).toEqual(undefined);
            });

            it("is the minimum value", function () {
                column = new DataSeries.Column();
                column.expression = "foo";
                column.data = [{foo: 1}, {foo: 2}, {foo: 0}];
                expect(column.min).toEqual(0);
            });

            it("is bindable", function () {
                column = new DataSeries.Column();
                column.expression = "foo";
                column.data = [{foo: 2}];
                var o = frb.defineBinding({}, "min", {"<-": "min", source: column});
                expect(o.min).toEqual(2);
                column.data.push({foo: 1});
                expect(o.min).toEqual(1);
            });
        });

        describe("max", function () {
            it("is undefined without data", function () {
                column = new DataSeries.Column();
                column.expression = "foo";
                expect(column.max).toEqual(undefined);
            });

            it("is the maximum value", function () {
                column = new DataSeries.Column();
                column.expression = "foo";
                column.data = [{foo: 1}, {foo: 2}, {foo: 0}];
                expect(column.max).toEqual(2);
            });

            it("is bindable", function () {
                column = new DataSeries.Column();
                column.expression = "foo";
                column.data = [{foo: 1}];
                var o = frb.defineBinding({}, "max", {"<-": "max", source: column});
                expect(o.max).toEqual(1);
                column.data.push({foo: 2});
                expect(o.max).toEqual(2);
            });
        });
    });

    it("can define columns", function () {
        dataSeries = new DataSeries();
        dataSeries.defineColumn("foo", {"<-": "bar"});
        dataSeries.data = [{bar: 1}, {bar: 2}, {bar: 3}];
        expect(dataSeries.columns.has('foo')).toBe(true);
        expect(dataSeries.columns.get('foo').data).toEqual(dataSeries.data);
        expect(dataSeries.columns.get('foo').expression).toEqual("bar");
    });

    xit("can deserialize", function () {
        var serializedDataSeries = {
            "dataSeries": {
                "prototype": "montage-charts/logic/model/data-series",
                "values": {
                    "data": [{"bar": 1}, {"bar": 2}, {"bar": 3}],
                    "columns": {
                        "foo": {"<-": "bar"}
                    }
                }
            }
        };
        return new Deserializer().init(JSON.stringify(serializedDataSeries), require).deserializeObject().then(function (dataSeries) {
            // TODO: Returns undefined under test, but works in a real app?
            console.log('deserialized', dataSeries);
        });
    });
});
