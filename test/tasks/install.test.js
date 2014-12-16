'use strict';

var expect = require('expect.js');
var gulp = require('gulp');
var rimraf = require('rimraf');

var fs = require('fs');
var path = require('path');

var install = require('../../lib/tasks/install');
var oTestPath = 'test/fixtures/o-test';

xdescribe('Install task', function() {
	before(function() {
		process.chdir(oTestPath);
	});

	after(function() {
		process.chdir('../../..');
	});

	it('should install Sass', function(done) {
		install.installSass();
	});
});
