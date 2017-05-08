'use strict';

require('colors');

module.exports = function () {

	const errors = [];

	const ListrReporter = function (baseReporterDecorator, formatError) {
		baseReporterDecorator(this);

		this.failedSpecs = Object.create(null);
		this.currentSuite = [];

		this.onRunComplete = (browsers, results) => {
			errors.length = 0;
			let totalTestsFailed = 0;
			let totalBrowsersFailed = 0;

			browsers.forEach((browser) => {
				if (results.failed) {

					if (this.failedSpecs[browser.id]) {

						++totalBrowsersFailed;

						errors.push((browser.name + ' failed specs:').white);

						this.failedSpecs[browser.id].forEach((value) => {

							++totalTestsFailed;

							errors.push((value.suite.map((value) => value + ' > ').join('') + value.description).white);

							const msg = value.log.map(log => formatError(log, '\t')).join('\n').split('\n');

							errors.push(msg.shift().red);
							errors.push(msg.join('\n').red);
						});
					}
				}
			});

			this.failedSpecs = Object.create(null);
			this.currentSuite = [];

			if (errors.length > 0) {
				errors.push(`${totalTestsFailed} tests failed across ${totalBrowsersFailed} browsers.`);
			}
		};

		this.onSpecComplete = function (browser, result) {
			if (result.success === false) {
				if (!this.failedSpecs[browser.id]) {
					this.failedSpecs[browser.id] = [];
				}
				this.failedSpecs[browser.id].push(result);
			}
		};
	};

	ListrReporter.$inject = ['baseReporterDecorator', 'formatError'];

	return {
		reporter: {
			'reporter:listr': ['type', ListrReporter]
		},
		errors
	};

};
