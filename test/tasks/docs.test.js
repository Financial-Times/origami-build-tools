/* global describe, it, before, after */
'use strict';

var expect = require('expect.js');
var gulp = require('gulp');

var fs = require('fs-extra');

var docs = require('../../lib/tasks/docs');

var obtPath = process.cwd();
var oTestPath = 'test/fixtures/o-test';

describe('Docs task', function() {
	before(function() {
		process.chdir(oTestPath);
	});

	after(function() {
		process.chdir(obtPath);
	});

	describe('SassDoc', function() {
		it('should generate SassDoc in default directory', function(done) {
			var stream = docs.sassDoc(gulp);
			stream.resume();
			stream.on('end', function() {
					expect(fs.existsSync('./docs/sass/index.html')).to.be(true);
					expect(fs.existsSync('./docs/sass/assets')).to.be(true);
					fs.removeSync('./docs');
					done();
				});
		});

		it('should generate SassDoc in custom directory', function(done) {
			var stream = docs.sassDoc(gulp, {
				sassDir: 'test'
			});
			stream.resume();
			stream.on('end', function() {
				expect(fs.existsSync('./test/docs/sass/index.html')).to.be(true);
				expect(fs.existsSync('./test/docs/sass/assets')).to.be(true);
				fs.removeSync('./test');
				done();
			});
		});
	});
});
