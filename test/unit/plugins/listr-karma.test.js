/* eslint-env mocha */

'use strict';

const colors = require('colors/safe');
const proclaim = require('proclaim');

const formatError = function (a, b) {
	return a + b;
};

const baseReporterDecorator = function () {}; // eslint-disable-line no-empty-function

describe('SpecReporter', function () {
	let SpecReporter;
	let errors;

	beforeEach(() => {
		const listrKarmaReporter = require('../../../lib/plugins/listr-karma.js')();
		SpecReporter = listrKarmaReporter.reporter['reporter:listr'];
		errors = listrKarmaReporter.errors;
	});

	describe('functionality', function () {
		describe('onRunComplete', function () {
			describe('with no browsers', function () {
				let newSpecReporter;

				beforeEach(function () {
					newSpecReporter = new SpecReporter[1](baseReporterDecorator, formatError);

					newSpecReporter.currentSuite.push('suite name');
					newSpecReporter.onRunComplete([], []);
				});

				it('should reset failedSpecs object', function () {
					proclaim.deepEqual(newSpecReporter.failedSpecs, {});
				});

				it('should reset currentSuite arrays', function () {
					proclaim.equal(newSpecReporter.currentSuite.length, 0);
				});

				it('should not add anything to the errors array', function () {
					proclaim.equal(errors.length, 0);
				});
			});

			describe('with browsers', function () {
				describe('and there are no failures', function () {
					let newSpecReporter;

					beforeEach(function () {
						newSpecReporter = new SpecReporter[1](baseReporterDecorator, formatError);
						newSpecReporter.onRunComplete(['testValue'], {
							failed: 0
						});
					});

					it('should reset failedSpecs object', function () {
						proclaim.deepEqual(newSpecReporter.failedSpecs, {});
					});

					it('should reset currentSuite arrays', function () {
						proclaim.equal(newSpecReporter.currentSuite.length, 0);
					});

					it('should not add anything to the errors array', function () {
						proclaim.equal(errors.length, 0);
					});
				});

				describe('and there are failures', function () {
					let newSpecReporter;
					let browser;
					let failedSpec;
					beforeEach(function () {
						browser = {
							name: 'Test Browser',
							id: 'testValue'
						};
						failedSpec = {
							suite: ['suite name'],
							description: 'description of test',
							log: ['log', 'message']
						};
						newSpecReporter = new SpecReporter[1](baseReporterDecorator, formatError);
						newSpecReporter.currentSuite.push(failedSpec.suite);
						newSpecReporter.failedSpecs = {
							[browser.id]: [failedSpec]
						};
						newSpecReporter.onRunComplete([browser], {
							failed: 1
						});
					});

					it('should reset failedSpecs object', function () {
						proclaim.deepEqual(newSpecReporter.failedSpecs, {});
					});

					it('should reset currentSuite arrays', function () {
						proclaim.equal(newSpecReporter.currentSuite.length, 0);
					});

					it('should add error message to the errors array', function () {
						proclaim.deepEqual(errors, [
							colors.white('Test Browser failed specs:'),
							colors.white('suite name > description of test'),
							colors.red('log message\t'),
							'',
							'1 tests failed across 1 browsers.'
						]);
					});

					it('should be idempotent', () => {
						newSpecReporter.currentSuite.push(failedSpec.suite);
						newSpecReporter.failedSpecs = {
							[browser.id]: [failedSpec]
						};
						newSpecReporter.onRunComplete([browser], {
							failed: 1
						});

						proclaim.deepEqual(errors, [
							colors.white('Test Browser failed specs:'),
							colors.white('suite name > description of test'),
							colors.red('log message\t'),
							'',
							'1 tests failed across 1 browsers.'
						]);
					});
				});
			});
		});

		describe('onSpecComplete', function () {
			let newSpecReporter;
			let browser;
			let failedResult;
			let passedResult;

			beforeEach(() => {
				browser = {
					name: 'Test Browser',
					id: 'testValue'
				};
				failedResult = {
					suite: ['suite name'],
					description: 'description of test',
					log: ['log message'],
					success : false
				};

				passedResult = {
					suite: ['suite name'],
					description: 'description of test',
					log: ['log message'],
					success : true
				};
				newSpecReporter = new SpecReporter[1](baseReporterDecorator, formatError);
			});

			describe('no failed specs', () => {
				it('should not anything to failedSpecs ', function () {
					newSpecReporter.onSpecComplete(browser, passedResult);
					proclaim.deepEqual(newSpecReporter.failedSpecs, {});
				});
			});

			describe('failed specs', () => {
				it('should add array of failed specs for browser to the failedSpecs property ', function () {
					newSpecReporter.onSpecComplete(browser, failedResult);

					const failedSpec = Object.create(null);
					failedSpec[browser.id] = [failedResult];
				});
			});
		});
	});
});
