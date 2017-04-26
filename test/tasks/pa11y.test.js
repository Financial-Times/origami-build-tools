/* eslint-env mocha */
'use strict';

const expect = require('expect.js');
const gulp = require('gulp');

const fs = require('fs-extra');
const path = require('path');

const demo = require('../../lib/tasks/demo');
const pa11y = require('../../lib/tasks/pa11y');

const obtPath = process.cwd();
const oTestPath = 'test/fixtures/o-test';

describe('Test task', function() {
	describe('Pa11y', function() {
		const pathSuffix = '-test-pa11y';
		const testTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

		beforeEach(function(done) {
			fs.copySync(path.resolve(obtPath, oTestPath), testTestPath);
			process.chdir(testTestPath);
			const demoStream = demo(gulp, {
				demoConfig: 'origami.json',
				demoFilter: ['pa11y']
			});
			demoStream.on('end', done);
			demoStream.resume();
		});

		afterEach(function() {
			process.chdir(obtPath);
			fs.removeSync(testTestPath);
		});

		describe('default title', () => {
			it('should be "Executing Pa11y"', () => {
				expect(pa11y.title).to.be('Executing Pa11y');
			});
		});

		describe('skip', () => {
			it('should return a truthy value if the file does not exist', () => {
				fs.removeSync(path.join(process.cwd(), '/demos/local/pa11y.html'));
				expect(Boolean(pa11y.skip())).to.be(true);
			});

			it('should return a helpful message if the file does not exist', () => {
				fs.removeSync(path.join(process.cwd(), '/demos/local/pa11y.html'));
				expect(pa11y.skip()).to.be(`No Pa11y demo found. To run Pa11y against this project, create a file at ${path.join(process.cwd(), '/demos/local/pa11y.html')}`);
			});

			it('should return a falsey value if the file does exist', () => {
				expect(Boolean(pa11y.skip())).to.be(false);
			});
		});

		describe('task', () => {
			it('should run pa11y correctly', function() {
				return pa11y.task()
					.catch(function (results) {
						expect(results).to.be.an(Error);
					});
			});
		});
	});
});
