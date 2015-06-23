/* global describe, it, before, after */
'use strict';

var expect = require('expect.js');
var gulp = require('gulp');

var fs = require('fs-extra');
var path = require('path');

var verify = require('../../lib/tasks/verify');

var obtPath = process.cwd();
var oTestPath = 'test/fixtures/o-test';
var pathSuffix = '-verify';
var verifyTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

describe('Verify task', function() {
	before(function() {
		fs.copySync(path.resolve(obtPath, oTestPath), verifyTestPath);
		process.chdir(verifyTestPath);
		fs.writeFileSync('src/scss/verify.scss', '$color: #ccc;\n\np {\n  color: $color!important ;\n}\n', 'utf8');
		fs.writeFileSync('src/js/verify.js', 'var test = "We live in financial times";');
	});

	after(function() {
		process.chdir(obtPath);
		fs.removeSync(path.resolve(obtPath, verifyTestPath));
	});

	it('should run scssLint with default config', function(done) {
		verify.scssLint(gulp)
			.on('error', function(error) {
				expect(error.message).to.be('SCSS-Lint failed for: src/scss/verify.scss');
				done();
			});
	});

	it('should run scssLint with custom config', function(done) {
		verify.scssLint(gulp, {
			scssLintPath: 'scss-lint.yml',
			// Verify only verify.scss:
			excludeFiles: ['!**/demo.scss', '!**/test.scss', '!**/main.scss']
		})
		.on('error', function(e) {
			console.log(e); done();
		})
		.on('end', function() {
			done();
		});
	});

	it('should run jsHint with default config', function(done) {
		verify.jsHint(gulp)
			.on('error', function(error) {
				expect(error.message).to.be('JSHint failed for: ' + path.resolve(verifyTestPath, 'src/js/verify.js'));
				done();
			});
	});

	it('should run jsHint with custom config', function(done) {
		var stream = verify.jsHint(gulp, {
			jsHintPath: 'jshint.json'
		})
		.on('error', function(error) {
			expect(error.message).to.be(undefined);
		});

		stream.resume();
		stream.on('end', function() {
			done();
		});
	});

	it('should run origamiJson check', function(done) {
		verify.origamiJson()
			.then(function(verifiedOrigamiJson) {
				expect(verifiedOrigamiJson.length).to.be(0);
				fs.writeFileSync('origami.json', JSON.stringify({}), 'utf8');
				return verify.origamiJson();
			})
			.then(function() {}, function(verifiedOrigamiJson) {
				expect(verifiedOrigamiJson).to.contain('A non-empty description property is required');
				expect(verifiedOrigamiJson).to.contain('The origamiType property needs to be set to either "module" or "service"');
				expect(verifiedOrigamiJson).to.contain('A non-empty description property is required');
				expect(verifiedOrigamiJson).to.contain('The origamiVersion property needs to be set to 1');
				expect(verifiedOrigamiJson).to.contain('The support property must be an email or url to an issue tracker for this module');
				expect(verifiedOrigamiJson).to.contain('The supportStatus property must be set to either "active", "maintained", "deprecated", "dead" or "experimental"');
				done();
			});
	});
});
