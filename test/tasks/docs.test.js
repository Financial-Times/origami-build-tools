'use strict';

var expect = require('expect.js');
var gulp = require('gulp');
var rimraf = require('rimraf');

var fs = require('fs');
var path = require('path');

var docs = require('../../lib/tasks/docs');
var oTestPath = 'test/fixtures/o-test';

xdescribe('Docs task', function() {
	before(function() {
		process.chdir(oTestPath);
	});

	after(function() {
		process.chdir('../../..');
	});

	describe('SassDoc', function() {
		it('should generate SassDoc in default directory', function(done) {
			docs.sassDoc(gulp)
				.on('data', function() {
					expect(fs.existsSync('./docs/sass/index.html')).to.be(true);
					expect(fs.existsSync('./docs/sass/assets')).to.be(true);
					rimraf.sync('./docs');
					done();
				});
		});

		it('should generate SassDoc in custom directory', function(done) {
			docs.sassDoc(gulp, {
				sassDir: 'test'
			})
			.on('data', function() {
				expect(fs.existsSync('./test/docs/sass/index.html')).to.be(true);
				expect(fs.existsSync('./test/docs/sass/assets')).to.be(true);
				rimraf.sync('./test');
				done();
			});
		});
	});
});
