module.exports = require("montage-testing").run(require, [
    "spec/data-series-spec",
]).then(function () {
    console.log('montage-testing', 'End');
}, function (err) {
    console.log('montage-testing', 'Fail', err, err.stack);
});
