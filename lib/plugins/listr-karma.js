'use strict';

const colors = require('colors/safe');

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

						errors.push(colors.white(browser.name + ' failed specs:'));

						this.failedSpecs[browser.id].forEach((value) => {

							++totalTestsFailed;

							errors.push(colors.white(value.suite.map((value) => value + ' > ').join('') + value.description));

							const msg = value.log.map(log => formatError(log, '\t')).join('\n').split('\n');

							errors.push(colors.red(msg.shift()));
							errors.push(colors.red(msg.join('\n')));
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
