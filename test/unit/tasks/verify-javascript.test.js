/* eslint-env mocha */
'use strict';

const proclaim = require('proclaim');

const fs = require('fs-extra');
const path = require('path');
const rimraf = require('rimraf');
const process = require('process');

const verifyJavascript = require('../../../lib/tasks/verify-javascript');

const obtPath = process.cwd();
const oTestPath = 'test/unit/fixtures/o-test';
const pathSuffix = '-verify';
const verifyTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

describe('verify-javascript', function() {
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
		it('should be "Linting Javascript"', () => {
			proclaim.equal(verifyJavascript().title, 'Linting Javascript');
		});
	});

	describe('skip', () => {
		it('should return true if the file does not exist', () => {
			rimraf.sync('**/**.js');
			return verifyJavascript().skip().then(skip => {
				proclaim.ok(skip);
			});
		});

		it('should return a helpful message if the file does not exist', () => {
			rimraf.sync('**/**.js');
			return verifyJavascript().skip().then(skip => {
				proclaim.equal(skip, 'No Javascript files found.');
			});
		});

		it('should return a falsey value if the file does exist', () => {
			return verifyJavascript().skip().then(skip => {
				proclaim.notOk(skip);
			});
		});
	});

	describe('task', () => {
		it('should not error if there are no Javascript files', async () => {
			rimraf.sync('**/**.js');
			await verifyJavascript().task();
		});

		it('should throw error if there are linting violations', async function() {
			try {
				await verifyJavascript().task();
			} catch (e) {
				proclaim.deepEqual(e.message, 'Failed linting: \n\n' +
				'./src/js/syntax-error.js:1:6 Error - Parsing error: Unexpected token test\n' +
				'./src/js/verify.js:1:7 Error - \'test\' is assigned a value but never used. (no-unused-vars)\n\n' +
				'2 linting errors');
			}
		});
	});
});
