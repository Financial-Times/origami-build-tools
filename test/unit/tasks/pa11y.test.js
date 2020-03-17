/* eslint-env mocha */
'use strict';

const proclaim = require('proclaim');
const process = require('process');
const fs = require('fs-extra');
const path = require('path');

const demo = require('../../../lib/tasks/demo-build');
const pa11y = require('../../../lib/tasks/pa11y');

const obtPath = process.cwd();
const oTestPath = 'test/unit/fixtures/o-test';

describe('Test task', function() {
	describe('Pa11y', function() {
		const pathSuffix = '-test-pa11y';
		const testTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

		beforeEach(function() {
			fs.copySync(path.resolve(obtPath, oTestPath), testTestPath);
			process.chdir(testTestPath);
			return demo({
				demoConfig: 'origami.json',
				demoFilter: ['pa11y']
			});
		});

		afterEach(function() {
			process.chdir(obtPath);
			fs.removeSync(testTestPath);
		});

		describe('default title', () => {
			it('should be "Executing Pa11y"', () => {
				proclaim.equal(pa11y().title, 'Executing Pa11y');
			});
		});

		describe('skip', () => {
			it('should return a truthy value if the file does not exist', function() {
				fs.removeSync(path.join(process.cwd(), '/demos/local/pa11y.html'));
				return pa11y().skip().then(result => proclaim.isTrue(Boolean(result)));
			});

			it('should return a helpful message if the file does not exist', function() {
				fs.removeSync(path.join(process.cwd(), '/demos/local/pa11y.html'));
				return pa11y().skip().then(result => proclaim.equal(result, `No Pa11y demo found. To run Pa11y against this project, create a file at ${path.join(process.cwd(), '/demos/local/pa11y.html')}`));
			});

			it('should return a falsey value if the file does exist', function() {
				return pa11y().skip().then(result => proclaim.isFalse(Boolean(result)));
			});
		});

		describe('task', () => {
			it('should run pa11y correctly', function () {
				this.timeout(10000);
				return pa11y().task()
					.catch(function (results) {
						proclaim.isInstanceOf(results, Error);
					});
			});
		});
	});
});
