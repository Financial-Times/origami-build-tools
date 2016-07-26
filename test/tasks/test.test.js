/* global describe, it, before, after */
'use strict';

const expect = require('expect.js');
const gulp = require('gulp');

const fs = require('fs-extra');
const path = require('path');

const demo = require('../../lib/tasks/demo');
const test = require('../../lib/tasks/test');

const obtPath = process.cwd();
const oTestPath = 'test/fixtures/o-test';

describe('Test task', function() {
	describe('Pa11y', function() {
		const pathSuffix = '-test-pa11y';
		const testTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

		before(function(done) {
			fs.copySync(path.resolve(obtPath, oTestPath), testTestPath);
			process.chdir(testTestPath);
			const demoStream = demo(gulp, {
				demoConfig: 'origami.json',
				demoFilter: ['pa11y']
			});
			demoStream
			.on('end', done);
			demoStream.resume();
		});

		after(function() {
			process.chdir(obtPath);
			fs.removeSync(testTestPath);
		});

		it('should not fail when the file is not found', function(done){
			// run pa11y subtask
			let res = test.pa11yTest(gulp, {
				// set an empty path
				pa11yPath: './file.html'
			});
			res
			.then(function() {
				expect(true).to.be(false);
				done();
			})
			.catch(function errorHandler(err) {
				expect(err);
				done();
			});
		});

		it('should run pa11y correctly', function(done) {
			// run pa11y subtask
			let res = test.pa11yTest();
			res
			.then(function() {
				done();
			})
			.catch(function errorHandler() {
				expect(true).to.be(false);
				done();
			});
		});
	});
});
