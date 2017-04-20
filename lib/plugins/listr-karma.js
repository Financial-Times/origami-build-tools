'use strict';

require('colors');

module.exports = function (errors) {

	const ListrReporter = function (baseReporterDecorator, formatError) {
		baseReporterDecorator(this);

		this.failedSpecs = [];

		this.onRunComplete = (browsers, results) => {
			let totalTestsFailed = 0;
			let totalBrowsersFailed = 0;

			browsers.forEach((browser) => {
				if (results.failed) {

					if (this.failedSpecs[browser.id]) {

						++totalBrowsersFailed;

						errors.push((browser + ' failed specs:').white);

						this.failedSpecs[browser.id].forEach((value) => {

							++totalTestsFailed;

							errors.push((value.suite.map((value) => value + ' > ').join('') + value.description).white);

							const msg = value.log.map(log => formatError(log, '\t')).split('\n');

							errors.push(msg.shift().red);
							errors.push(msg.join('\n').red);
						});
					}
				}
			});

			this.failedSpecs = [];

			if (errors.length > 0) {
				errors.push(`${totalTestsFailed} tests failed across ${totalBrowsersFailed} browsers.`);
			}
		};

		this.currentSuite = [];
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
			'reporter:listr': ['type', ListrReporter]
		};

};
