/* eslint-env mocha */
'use strict';

const proclaim = require('proclaim');

const path = require('path');
const process = require('process');

const verifyJavascript = require('../../../lib/tasks/verify-javascript');

const obtPath = process.cwd();
const oTestPath = 'test/unit/fixtures/verify';
const verifyTestPath = path.resolve(obtPath, oTestPath);

describe('verify-javascript', function() {
	beforeEach(function () {
		process.chdir(verifyTestPath);
	});

	afterEach(function () {
		process.chdir(obtPath);
	});

	describe('default title', () => {
		it('should be "Linting Javascript"', () => {
			process.chdir('./src/js/error');
			proclaim.equal(verifyJavascript().title, 'Linting Javascript');
		});
	});

	describe('skip', () => {
		it('should return true if the file does not exist', () => {
			// there is no js in the scss folder to verify
			process.chdir('./src/scss');
			return verifyJavascript().skip().then(skip => {
				proclaim.ok(skip);
			});
		});

		it('should return a helpful message if the file does not exist', () => {
			// there is no js in the scss folder to verify
			process.chdir('./src/scss');
			return verifyJavascript().skip().then(skip => {
				proclaim.equal(skip, 'No Javascript files found.');
			});
		});

		it('should return a falsey value if the file does exist', () => {
			process.chdir('./src/js/error');
			return verifyJavascript().skip().then(skip => {
				proclaim.notOk(skip);
			});
		});
	});

	describe('task', () => {
		it('should not error if there are no Javascript files', async () => {
			// there is no js in the scss folder to verify
			process.chdir('./src/scss');
			await verifyJavascript().task();
		});

		it('should throw error if there are linting violations', async function() {
			try {
				process.chdir('./src/js/warning');
				await verifyJavascript().task();
			} catch (e) {
				proclaim.ok(e, `Unexpected error: ${e.message}`);
			}
		});

		it('should not throw error if there are linting warnings', async function() {
			try {
				process.chdir('./src/scss');
				await verifyJavascript().task();
			} catch (e) {
				proclaim.deepEqual(e.message, 'Failed linting: \n\n' +
				'./src/js/invalid.js:1:6 Error - Parsing error: Unexpected token test\n' +
				'./src/js/unused-constant.js:1:7 Error - \'test\' is assigned a value but never used. (no-unused-vars)\n\n' +
				'2 linting errors');
			}
		});
	});
});
