/* eslint-env mocha */
'use strict';

const expect = require('expect.js');
const gulp = require('gulp');

const fs = require('fs-extra');
const path = require('path');

const verify = require('../../lib/tasks/verify');

const obtPath = process.cwd();
const oTestPath = 'test/fixtures/o-test';
const pathSuffix = '-verify';
const verifyTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

describe('Verify task', function() {
	before(function() {
		fs.copySync(path.resolve(obtPath, oTestPath), verifyTestPath);
		process.chdir(verifyTestPath);
		fs.writeFileSync('src/scss/verify.scss', '$color: #ccc;\n\np {\n  color: $color!important ;\n}\n', 'utf8');
		fs.writeFileSync('src/js/verify.js', 'const test = \'We live in financial times\';\n');
	});

	after(function() {
		process.chdir(obtPath);
		fs.removeSync(path.resolve(obtPath, verifyTestPath));
	});

	it('should run sassLint with default config', function(done) {
		verify.sassLint(gulp)
			.on('error', function(error) {
				expect(error.message).to.be('3 errors detected in src/scss/verify.scss');
				done();
			});
	});

	it('should run sassLint with custom config', function(done) {
		verify.sassLint(gulp, {
			sassLintPath: 'scss-lint.yml',
			// Verify only verify.scss:
			excludeFiles: ['!**/demo.scss', '!**/test.scss', '!**/main.scss']
		}).on('end', function() {
			done();
		});
	});

	it('should run esLint with default config', function(done) {
		verify.esLint(gulp)
		.on('error', function(error) {
			expect(error.message).to.be('Failed with 2 errors');
			done();
		});
	});

	it('should run esLint with custom config', function(done) {
		const stream = verify.esLint(gulp, {
			esLintPath: '.eslintrc',
			excludeFiles: ['!./src/js/syntax-error.js']
		})
		.on('error', function(error) {
			expect(error.message).to.be(undefined);
		});

		stream.resume();
		stream.on('end', function() {
			done();
		});
	});

	describe('verify origami.json', function() {
		it('should run origami.json check successfully', function() {
			return verify.origamiJson()
				.then(function(verifiedOrigamiJson) {
					expect(verifiedOrigamiJson.length).to.be(0);
				});
		});

		it('should fail with an empty origami.json', function() {
			fs.writeFileSync('origami.json', JSON.stringify({}), 'utf8');

			return verify.origamiJson()
				.then(function() {}, function(verifiedOrigamiJson) {
					expect(verifiedOrigamiJson).to.contain('A non-empty description property is required');
					expect(verifiedOrigamiJson).to.contain('The origamiType property needs to be set to either "module" or "service"');
					expect(verifiedOrigamiJson).to.contain('A non-empty description property is required');
					expect(verifiedOrigamiJson).to.contain('The origamiVersion property needs to be set to 1');
					expect(verifiedOrigamiJson).to.contain('The support property must be an email or url to an issue tracker for this module');
					expect(verifiedOrigamiJson).to.contain('The supportStatus property must be set to either "active", "maintained", "deprecated", "dead" or "experimental"');
				});
		});

		it('should fail when an expanded property is found for a demo', function() {
			fs.writeFileSync('origami.json', JSON.stringify({ demos: [ { expanded: false }, { expanded: true } ] }), 'utf8');

			return verify.origamiJson()
				.then(function() {}, function(verifiedOrigamiJson) {
					expect(verifiedOrigamiJson).to.contain('The expanded property has been deprecated. Use the "hidden" property when a demo should not appear in the Registry.');
				});
		});
	});

});
