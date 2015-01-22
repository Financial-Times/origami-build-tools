/* global xdescribe, it, before, after */
'use strict';

var expect = require('expect.js');
var gulp = require('gulp');

var fs = require('fs');

var verify = require('../../lib/tasks/verify');
var oTestPath = 'test/fixtures/o-test';

xdescribe('Verify task', function() {
	before(function() {
		process.chdir(oTestPath);
		fs.writeFileSync('src/scss/verify.scss', 'p { color: #ccc; }', 'utf8');
	});

	after(function() {
		process.chdir('../../..');
		fs.unlink('src/scss/verify.scss');
	});

	it('should run scssLint with default config', function(done) {
		verify.scssLint(gulp)
			.on('end', function() {
				expect(true).to.be(true);
				done();
			});
	});
});
