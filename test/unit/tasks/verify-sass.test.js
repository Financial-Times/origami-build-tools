'use strict';
/* eslint-env mocha */

const proclaim = require('proclaim');
const process = require('process');

const path = require('path');

const verify = require('../../../lib/tasks/verify-sass');

const obtPath = process.cwd();
const oTestPath = 'test/unit/fixtures/verify';
const verifyTestPath = path.resolve(obtPath, oTestPath);

describe('verify-sass', function () {
	beforeEach(function () {
		process.chdir(verifyTestPath);
	});

	afterEach(function () {
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

		it.only('should throw error where there are linting violations', function () {
			const expectedNotices = [
				{
					name: 'border-zero',
					type: 'Error',
					locations: [
						'border-zero/invalid.scss:2:10',
						'border-zero/invalid.scss:6:15'
					]
				},
				{
					name: 'brace-style',
					type: 'Error',
					locations: [
						'brace-style/invalid.scss:2:1',
						'brace-style/invalid.scss:8:1',
						'brace-style/invalid.scss:13:1',
						'brace-style/invalid.scss:18:1',
					]
				},
				{
					name: 'class-name-format',
					type: 'Error',
					locations: [
						'class-name-format/invalid.scss:1:2',
						'class-name-format/invalid.scss:5:2',
						'class-name-format/invalid.scss:9:2',
						'class-name-format/invalid.scss:13:2',
						'class-name-format/invalid.scss:17:2'
					]
				},
				{
					name: 'clean-import-paths',
					type: 'Warning',
					locations: [
						'clean-import-paths/invalid.scss:2:2',
						'clean-import-paths/invalid.scss:4:2',
						'clean-import-paths/invalid.scss:6:2',
					]
				},
				{
					name: 'extends-before-declarations',
					type: 'Warning',
					locations: [
						'extends-before-declarations/invalid.scss:7:3'
					]
				},
				{
					name: 'extends-before-mixins',
					type: 'Warning',
					locations: [
						'extends-before-mixins/invalid.scss:11:3'
					]
				},
				{
					name: 'final-newline',
					type: 'Warning',
					locations: [
						'final-newline/invalid.scss:4:44'
					]
				},
				{
					name: 'function-name-format',
					type: 'Error',
					locations: [
						'function-name-format/invalid.scss:1:11',
						'function-name-format/invalid.scss:5:11',
					]
				},
				{
					name: 'hex-length',
					type: 'Error',
					locations: [
						'hex-length/invalid.scss:1:13',
						'hex-length/invalid.scss:4:36',
						'hex-length/invalid.scss:4:42',
						'hex-length/invalid.scss:8:10'
					]
				},
				{
					name: 'hex-notation',
					type: 'Warning',
					locations: [
						'hex-notation/invalid.scss:2:13',
						'hex-notation/invalid.scss:5:36',
						'hex-notation/invalid.scss:5:45',
						'hex-notation/invalid.scss:9:10'
					]
				},
				{
					name: 'leading-zero',
					type: 'Error',
					locations: [
						'leading-zero/invalid.scss:2:13'
					]
				},
				{
					name: 'mixin-name-format',
					type: 'Error',
					locations: [
						'mixin-name-format/invalid.scss:1:1',
						'mixin-name-format/invalid.scss:5:1'
					]
				},
				{
					name: 'mixins-before-declarations',
					type: 'Warning',
					locations: [
						'mixins-before-declarations/invalid.scss:9:5'
					]
				},
				{
					name: 'nesting-depth',
					type: 'Warning',
					locations: [
						'nesting-depth/invalid.scss:5:17'
					]
				},
				{
					name: 'no-debug',
					type: 'Error',
					locations: [
						'no-debug/invalid.scss:1:2'
					]
				},
				{
					name: 'no-duplicate-properties',
					type: 'Warning',
					locations: [
						'no-duplicate-properties/invalid.scss:3:3',
						'no-duplicate-properties/invalid.scss:8:3',
					]
				},
				{
					name: 'no-ids',
					type: 'Warning',
					locations: [
						'no-ids/invalid.scss:1:1'
					]
				},
				{
					name: 'no-important',
					type: 'Warning',
					locations: [
						'no-important/invalid.scss:2:43'
					]
				},
				{
					name: 'no-invalid-hex',
					type: 'Warning',
					locations: [
						'no-invalid-hex/invalid.scss:1:16'
					]
				}
			];
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
					for (const { name, type, locations } of expectedNotices) {
					locations.forEach(location => {
						const expectedPattern = new RegExp(
							`${location}[^\n]*${type}[^\n]*${name}`
						);
						proclaim.match(
							error.message,
							expectedPattern,
							`Expected a "${name}" "${type}" from "${location}".`
						);
					});
				}
			});
		});
	});
});
