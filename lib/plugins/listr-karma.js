'use strict';

const colors = require('colors/safe');
const isCI = require('is-ci');

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

							if (isCI) {
								const error = value.log.map(log => formatError(log, '\t')).join('\n').split('\n').filter(log => log.trim().length);
								const message = error.shift().trim();
								const file = error.pop().trim().replace('at ', '');
								const fullTestDescription = value.suite.map((suite) => suite + ' > ').join('') + value.description;

								errors.push(colors.white(file) + ' ' + fullTestDescription);
								errors.push(colors.white(browser.name + ' errored with:') + ' ' + colors.red(message));
							} else {
								errors.push(colors.white(value.suite.map((value) => value + ' > ').join('') + value.description));

								const msg = value.log.map(log => formatError(log, '\t')).join('\n').split('\n');

								errors.push(colors.red(msg.shift()));
								errors.push(colors.red(msg.join('\n')));
							}
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
