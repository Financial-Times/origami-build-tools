/* global xdescribe, it, before, after */
'use strict';

var expect = require('expect.js');
var gulp = require('gulp');

var fs = require('fs-extra');
var path = require('path');

var test = require('../../lib/tasks/test');
var log = require('../../lib/helpers/log');

var obtPath = process.cwd();
var oTestPath = 'test/fixtures/o-test';
var pathSuffix = '-test';
var testTestPath = path.resolve('/Users/alberto.elias/origami', 'o-overlay');

describe('Test task', function() {
	before(function() {
		//fs.copySync(path.resolve(obtPath, oTestPath), testTestPath);
		process.chdir(testTestPath);
	});

	after(function() {
		process.chdir(obtPath);
		//fs.removeSync(testTestPath);
	});

	it('should run nightwatch in out selenium proxy', function(done) {
		test._runBrowserTest({
			testUrl: 'http://build.origami.ft.com/files/o-overlay@1.4.5/demos'
		}).then(function(output) {
			console.log(output);
			done();
		}, function(output) {
			log.primaryError(output.stderr);
			log.secondaryError(output.stdout);
			done();
		});
	})
});
