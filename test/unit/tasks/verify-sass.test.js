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

		it('should output errors and warnings only where there are linting violations', function () {
			const expectedNotices = [
				{
					name: 'indentation',
					type: 'Error',
					locations: [
						'indentation/invalid.scss:2:5',
					]
				},
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
					// if a user ignores no-ids,
					// verify the name format of the ids
					name: 'id-name-format',
					type: 'Error',
					locations: [
						'id-name-format/invalid.scss:4:2',
						'id-name-format/invalid.scss:8:2',
						'id-name-format/invalid.scss:12:2',
						'id-name-format/invalid.scss:16:2',
						'id-name-format/invalid.scss:20:2'
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
					// if the user disables no-important,
					// verify there is no extra space `! important`
					name: 'space-after-bang',
					type: 'Error',
					locations: [
						'space-after-bang/invalid.scss:4:20'
					]
				},
				{
					// if the user disables no-important,
					// verify there is a space before the bang `; !important`
					name: 'space-before-bang',
					type: 'Error',
					locations: [
						'space-before-bang/invalid.scss:4:19'
					]
				},
				{
					name: 'no-invalid-hex',
					type: 'Warning',
					locations: [
						'no-invalid-hex/invalid.scss:1:16'
					]
				},
				{
					name: 'no-misspelled-properties',
					type: 'Warning',
					locations: [
						'no-misspelled-properties/invalid.scss:8:3',
						'no-misspelled-properties/invalid.scss:13:3',
						'no-misspelled-properties/invalid.scss:13:3'
					]
				},
				{
					name: 'no-qualifying-elements',
					type: 'Error',
					locations: [
						'no-qualifying-elements/invalid.scss:2:4',
						'no-qualifying-elements/invalid.scss:7:6'
					]
				},
				{
					name: 'no-qualifying-elements',
					type: 'Error',
					locations: [
						'no-qualifying-elements/invalid.scss:2:4',
						'no-qualifying-elements/invalid.scss:7:6'
					]
				},
				{
					name: 'no-trailing-zero',
					type: 'Error',
					locations: [
						'no-trailing-zero/invalid.scss:2:13',
						'no-trailing-zero/invalid.scss:6:13',
						'no-trailing-zero/invalid.scss:10:13'
					]
				},
				{
					name: 'no-vendor-prefixes',
					type: 'Warning',
					locations: [
						'no-vendor-prefixes/invalid.scss:1:2',
						'no-vendor-prefixes/invalid.scss:6:5',
						'no-vendor-prefixes/invalid.scss:9:3',
						'no-vendor-prefixes/invalid.scss:14:5',
						'no-vendor-prefixes/invalid.scss:15:5',
						'no-vendor-prefixes/invalid.scss:19:15',
						'no-vendor-prefixes/invalid.scss:23:5',
						'no-vendor-prefixes/invalid.scss:24:5',
						'no-vendor-prefixes/invalid.scss:25:5',
						'no-vendor-prefixes/invalid.scss:26:5',
						'no-vendor-prefixes/invalid.scss:27:5',
						'no-vendor-prefixes/invalid.scss:28:5'
					]
				},
				{
					name: 'placeholder-in-extend',
					type: 'Error',
					locations: [
						'placeholder-in-extend/invalid.scss:6:11'
					]
				},
				{
					name: 'placeholder-name-format',
					type: 'Error',
					locations: [
						'placeholder-name-format/invalid.scss:1:1',
						'placeholder-name-format/invalid.scss:5:1',
						'placeholder-name-format/invalid.scss:9:1',
						'placeholder-name-format/invalid.scss:13:1',
						'placeholder-name-format/invalid.scss:17:1'
					]
				},
				{
					name: 'shorthand-values',
					type: 'Error',
					locations: [
						'shorthand-values/invalid.scss:2:13',
						'shorthand-values/invalid.scss:6:13',
						'shorthand-values/invalid.scss:10:13'
					]
				},
				{
					name: 'single-line-per-selector',
					type: 'Error',
					locations: [
						'single-line-per-selector/invalid.scss:1:7'
					]
				},
				{
					name: 'space-after-colon',
					type: 'Error',
					locations: [
						'space-after-colon/invalid.scss:2:12'
					]
				},
				{
					name: 'space-after-comma',
					type: 'Error',
					locations: [
						'space-after-comma/invalid.scss:1:25',
						'space-after-comma/invalid.scss:6:23',
						'space-after-comma/invalid.scss:7:30'
					]
				},
				{
					name: 'space-before-brace',
					type: 'Error',
					locations: [
						'space-before-brace/invalid.scss:1:4',
						'space-before-brace/invalid.scss:2:16',
						'space-before-brace/invalid.scss:7:10'
					]
				},
				{
					name: 'space-before-colon',
					type: 'Error',
					locations: [
						'space-before-colon/invalid.scss:3:12'
					]
				},
				{
					name: 'space-between-parens',
					type: 'Error',
					locations: [
						'space-between-parens/invalid.scss:1:15',
						'space-between-parens/invalid.scss:1:20',
						'space-between-parens/invalid.scss:5:16',
						'space-between-parens/invalid.scss:10:18',
						'space-between-parens/invalid.scss:10:26',
						'space-between-parens/invalid.scss:11:18',
						'space-between-parens/invalid.scss:12:17'
					]
				},
				{
					name: 'trailing-semicolon',
					type: 'Error',
					locations: [
						'trailing-semicolon/invalid.scss:4:19'
					]
				},
				{
					name: 'variable-name-format',
					type: 'Error',
					locations: [
						'variable-name-format/invalid.scss:1:1',
						'variable-name-format/invalid.scss:3:1'
					]
				},
			];
			return verify().task().then(() => {
				throw new Error('No linting errors were thrown.');
			}, error => {
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
