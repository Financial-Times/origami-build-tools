'use strict';

var expect = require('expect.js');
var gulp = require('gulp');
var rimraf = require('rimraf');

var fs = require('fs');
var path = require('path');

var test = require('../../lib/tasks/test');
var oTestPath = 'test/fixtures/o-test';

xdescribe('Test task', function() {
	before(function() {
		process.chdir(oTestPath);
	});

	after(function() {
		process.chdir('../../..');
	});

	it('', function(done) {
	});
});
