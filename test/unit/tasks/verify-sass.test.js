'use strict';
/* eslint-env mocha */

const proclaim = require('proclaim');
const process = require('process');

const path = require('path');

const verify = require('../../../lib/tasks/verify-sass');

const obtPath = process.cwd();
const oTestPath = 'test/unit/fixtures/verify';
const verifyTestPath = path.resolve(obtPath, oTestPath);

describe('verify-sass', function() {
	beforeEach(function() {
		process.chdir(verifyTestPath);
	});

	afterEach(function() {
		process.chdir(obtPath);
	});

	describe('default title', () => {
		it('should be "Linting Sass"', () => {
			proclaim.equal(verify().title, 'Linting Sass');
		});
	});

	describe('skip', () => {
		it('should return true if the file does not exist', () => {
			// there is no scss to test in the js folder
			process.chdir(path.resolve(verifyTestPath, 'src/js'));
			return verify().skip().then(skip => {
				proclaim.ok(skip);
			});
		});

		it('should return a helpful message if the file does not exist', () => {
			// there is no scss to test in the js folder
			process.chdir(path.resolve(verifyTestPath, 'src/js'));
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
			// there is no scss to test in the js folder
			process.chdir(path.resolve(verifyTestPath, 'src/js'));
			verify().task();
		});

		it.only('should throw error where there are linting violations', function() {
			const expectedErrors = {
				'border-zero': [
					'border-zero/invalid.scss:2:10',
					'border-zero/invalid.scss:6:15'
				],
				'brace-style': [
					'brace-style/invalid.scss:2:1',
					'brace-style/invalid.scss:8:1',
					'brace-style/invalid.scss:13:1',
					'brace-style/invalid.scss:18:1',
				],
				'class-name-format': [
					'class-name-format/invalid.scss:1:2',
					'class-name-format/invalid.scss:5:2',
					'class-name-format/invalid.scss:9:2',
					'class-name-format/invalid.scss:13:2',
					'class-name-format/invalid.scss:17:2'
				],
				'clean-import-paths': [
					'clean-import-paths/invalid.scss:2:2',
					'clean-import-paths/invalid.scss:4:2',
					'clean-import-paths/invalid.scss:6:2',
				],
				'empty-line-between-blocks': [], // expect no empty-line-between-blocks errors
				'extends-before-declarations': [
					'extends-before-declarations/invalid.scss:7:3'
				],
				'extends-before-mixins': [
					'extends-before-mixins/invalid.scss:11:3'
				],
				'final-newline': [
					'final-newline/invalid.scss:4:44'
				],
				'function-name-format': [
      				'function-name-format/invalid.scss:1:11',
      				'function-name-format/invalid.scss:5:11',
				],
				'hex-length': [
					'hex-length/invalid.scss:1:13',
					'hex-length/invalid.scss:4:36',
					'hex-length/invalid.scss:4:42',
					'hex-length/invalid.scss:8:10'
				],
				'hex-notation': [
					'hex-notation/invalid.scss:2:13',
					'hex-notation/invalid.scss:5:36',
					'hex-notation/invalid.scss:5:45',
					'hex-notation/invalid.scss:9:10'
				],
				'indentation': [], // tabs or spaces, we don't verify
				'leading-zero': [
					'leading-zero/invalid.scss:2:13'
				],
				'mixin-name-format': [
					'mixin-name-format/invalid.scss:1:1',
					'mixin-name-format/invalid.scss:5:1'
				],
				'mixins-before-declarations': [
					'mixins-before-declarations/invalid.scss:9:5'
				],
				'nesting-depth': [
					'nesting-depth/invalid.scss:5:17'
				],
				'no-color-keywords': [], // we allow colour keywords
				'no-color-literals': [], // we allow css colour functions
				'no-css-comments': [], // we allow css comments
				'no-debug': [
					'no-debug/invalid.scss:1:2'
				],
				'no-duplicate-properties': [
					'no-duplicate-properties/invalid.scss:3:3',
					'no-duplicate-properties/invalid.scss:8:3',
				],
				'no-empty-ruleset': [], // we allow empty rulesets
				'no-ids': [
					'no-ids/invalid.scss:1:1'
				],
				'no-important': [
					'no-important/invalid.scss:2:43'
				],
				'no-invalid-hex': [
					'no-invalid-hex/invalid.scss:1:16'
				]
			};
			return verify().task().then(() => {
				throw new Error('No linting errors were thrown.');
			}, error => {
					console.log(error.message);
				// Assert no SCSS in a valid.scss file throws a linting error.
				proclaim.doesNotInclude(
					error.message,
					'/valid.scss',
					`Did not expect any Sass in "*/**/valid.scss" to fail.`
				);
				// Assert expected lint errors are thrown from invalid.scss files.
				for (const [expectedError, files] of Object.entries(expectedErrors)) {
					files.forEach(file => {
						const expectedPattern = new RegExp(
							`${file}[^\n]*${expectedError}`
						);
						proclaim.match(
							error.message,
							expectedPattern,
							`Expected a "${expectedError}" error from "${file}".`
						);
					});
				}
			});
		});
	});
});
