/* global xdescribe, it, before, after */
'use strict';

var expect = require('expect.js');
var gulp = require('gulp');

var fs = require('fs-extra');
var path = require('path');

var docs = require('../../lib/tasks/docs');

var obtPath = process.cwd();
var oTestPath = 'test/fixtures/o-test';
var pathSuffix = '-docs';
var docsTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

xdescribe('Docs task', function() {
	before(function() {
		fs.copySync(path.resolve(obtPath, oTestPath), docsTestPath);
		process.chdir(docsTestPath);
	});

	after(function() {
		process.chdir(obtPath);
		fs.removeSync(docsTestPath);
	});

	xdescribe('SassDoc', function() {
		it('should generate SassDoc in default directory', function(done) {
			docs.sassDoc(gulp).promise.then(function() {
				expect(fs.existsSync(path.join(docsTestPath, 'docs/sass/index.html'))).to.be(true);
				expect(fs.existsSync(path.join(docsTestPath, 'docs/sass/assets'))).to.be(true);
				done();
			});

		});

		it('should generate SassDoc in custom directory', function(done) {
			docs.sassDoc(gulp, {
				sassDir: 'test'
			}).promise.then(function() {
				expect(fs.existsSync(path.join(docsTestPath, 'test/docs/sass/index.html'))).to.be(true);
				expect(fs.existsSync(path.join(docsTestPath, 'test/docs/sass/assets'))).to.be(true);
				done();
			});
		});
	});
});
