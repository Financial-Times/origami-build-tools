'use strict';
/* eslint-env mocha */

const proclaim = require('proclaim');
const process = require('process');
const rimraf = require('rimraf');

const fs = require('fs-extra');
const path = require('path');

const verify = require('../../../lib/tasks/verify-sass');

const obtPath = process.cwd();
const oTestPath = 'test/unit/fixtures/o-test';
const pathSuffix = '-verify';
const verifyTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

describe('verify-sass', function() {
	beforeEach(function() {
		fs.copySync(path.resolve(obtPath, oTestPath), verifyTestPath);
		process.chdir(verifyTestPath);
		fs.writeFileSync('src/scss/verify.scss', '$color: #ccc;\n\np {\n  color: $color!important ;\n}\n', 'utf8');
		fs.writeFileSync('src/js/verify.js', 'const test = \'We live in financial times\';\n');
	});

	afterEach(function() {
		process.chdir(obtPath);
		fs.removeSync(path.resolve(obtPath, verifyTestPath));
	});

	describe('default title', () => {
		it('should be "Linting Sass"', () => {
			proclaim.equal(verify().title, 'Linting Sass');
		});
	});

	describe('skip', () => {
		it('should return true if the file does not exist', () => {
			rimraf.sync('**/**.scss');
			return verify().skip().then(skip => {
				proclaim.ok(skip);
			});
		});

		it('should return a helpful message if the file does not exist', () => {
			rimraf.sync('**/**.scss');
			return verify().skip().then(skip => {
				proclaim.equal(skip, 'No Sass files found.');
			});
		});

		it('should return a falsey value if the file does exist', () => {
			return verify().skip().then(skip => {
				proclaim.notOk(skip);
			});
		});
	});

	describe('task', () => {
		it('should not error if there are no Sass files', () => {
			rimraf.sync('**/**.scss');
			verify().task();
		});

		it('should throw error if there are linting violations', function() {
			return verify().task().then(() => {
				proclaim.ok(false);
			}, error => {
				proclaim.deepStrictEqual(error.message, 'Failed linting: \n\n' +
				'./src/scss/verify.scss:1:9 Error - Hex values should use the long-form format - 6 characters (hex-length)\n' +
				'./src/scss/verify.scss:4:10 Error - Trailing semicolons required (trailing-semicolon)\n' +
				'./src/scss/verify.scss:4:16, Warning - !important not allowed (no-important)\n' +
				'./src/scss/verify.scss:4:16 Error - Whitespace required before !important (space-before-bang)\n\n' +
				'4 linting errors');
			});
		});
	});
});
