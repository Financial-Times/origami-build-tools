'use strict';
/* eslint-env mocha */

const proclaim = require('proclaim');
const process = require('process');

const path = require('path');

const verify = require('../../../lib/tasks/verify-sass');

const obtPath = process.cwd();
const oTestPath = 'test/unit/fixtures/verify';
const verifyTestPath = path.resolve(obtPath, oTestPath);

describe.only('verify-sass', function () {
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
					locations: [
						'indentation/invalid.scss:2:5',
					]
				},
				{
					name: 'declaration-property-value-blacklist',
					locations: [
						'border-zero/invalid.scss:2:2',
						'border-zero/invalid.scss:6:2'
					]
				},
				{
					name: 'block-opening-brace-space-before',
					locations: [
						'brace-style/invalid.scss:1:5',
						'brace-style/invalid.scss:7:5',
						'brace-style/invalid.scss:12:16',
						'brace-style/invalid.scss:17:13',
					]
				},
				{
					name: 'selector-class-pattern',
					locations: [
						'class-name-format/invalid.scss:1:1',
						'class-name-format/invalid.scss:5:1',
						'class-name-format/invalid.scss:9:1',
						'class-name-format/invalid.scss:13:1',
						'class-name-format/invalid.scss:17:1'
					]
				},
				{
					name: 'no-duplicate-at-import-rules',
					locations: [
						'no-duplicate-at-import-rules/invalid.scss:3:1'
					]
				},
				{
					name: 'scss/at-import-no-partial-leading-underscore',
					locations: [
						'clean-import-paths/invalid.scss:2:1',
						'clean-import-paths/invalid.scss:6:1',
					]
				},
				{
					name: 'scss/at-import-partial-extension',
					locations: [
						'clean-import-paths/invalid.scss:4:22',
						'clean-import-paths/invalid.scss:6:23',
					]
				},
				{
					name: 'order/order',
					locations: [
						'extends-before-declarations/invalid.scss:7:2',
						'extends-before-mixins/invalid.scss:11:2',
						'mixins-before-declarations/invalid.scss:9:2'
					]
				},
				{
					name: 'no-missing-end-of-source-newline',
					locations: [
						'final-newline/invalid.scss:4:44'
					]
				},
				{
					name: 'scss/at-function-pattern',
					locations: [
						'function-name-format/invalid.scss:1:1',
						'function-name-format/invalid.scss:5:1',
					]
				},
				{
					name: 'color-hex-length',
					locations: [
						'hex-length/invalid.scss:1:13',
						'hex-length/invalid.scss:4:35',
						'hex-length/invalid.scss:4:41',
						'hex-length/invalid.scss:8:9'
					]
				},
				{
					name: 'color-hex-case',
					locations: [
						'hex-notation/invalid.scss:2:13',
						'hex-notation/invalid.scss:5:35',
						'hex-notation/invalid.scss:5:44',
						'hex-notation/invalid.scss:9:9'
					]
				},
				{
					name: 'leading-zero',
					locations: [
						'leading-zero/invalid.scss:2:13'
					]
				},
				{
					name: 'scss/at-mixin-pattern',
					locations: [
						'mixin-name-format/invalid.scss:1:1',
						'mixin-name-format/invalid.scss:5:1'
					]
				},
				{
					name: 'max-nesting-depth',
					locations: [
						'nesting-depth/invalid.scss:5:5'
					]
				},
				{
					name: 'at-rule-blacklist',
					locations: [
						'no-debug/invalid.scss:1:1'
					]
				},
				{
					name: 'declaration-block-no-duplicate-properties',
					locations: [
						'no-duplicate-properties/invalid.scss:3:2',
						'no-duplicate-properties/invalid.scss:8:2',
					]
				},
				{
					name: 'selector-max-id',
					locations: [
						'no-ids/invalid.scss:1:1'
					]
				},
				{
					// if a user ignores no-ids,
					// verify the name format of the ids
					name: 'selector-id-pattern',
					locations: [
						'id-name-format/invalid.scss:4:1',
						'id-name-format/invalid.scss:8:1',
						'id-name-format/invalid.scss:12:1',
						'id-name-format/invalid.scss:16:1',
						'id-name-format/invalid.scss:20:1'
					]
				},
				{
					name: 'declaration-no-important',
					locations: [
						'no-important/invalid.scss:2:29'
					]
				},
				{
					// if the user disables no-important,
					// verify there is no extra space `! important`
					name: 'declaration-bang-space-after',
					locations: [
						'space-after-bang/invalid.scss:4:17'
					]
				},
				{
					// if the user disables no-important,
					// verify there is a space before the bang `; !important`
					name: 'declaration-bang-space-before',
					locations: [
						'space-before-bang/invalid.scss:4:16'
					]
				},
				{
					name: 'color-no-invalid-hex',
					locations: [
						'no-invalid-hex/invalid.scss:1:16'
					]
				},
				{
					name: 'property-no-unknown',
					locations: [
						'no-misspelled-properties/invalid.scss:3:2',
						'no-misspelled-properties/invalid.scss:8:2',
						'no-misspelled-properties/invalid.scss:13:2'
					]
				},
				{
					name: 'no-qualifying-elements',
					locations: [
						'no-qualifying-elements/invalid.scss:2:4',
						'no-qualifying-elements/invalid.scss:7:6'
					]
				},
				{
					name: 'no-qualifying-elements',
					locations: [
						'no-qualifying-elements/invalid.scss:2:4',
						'no-qualifying-elements/invalid.scss:7:6'
					]
				},
				{
					name: 'no-trailing-zero',
					locations: [
						'no-trailing-zero/invalid.scss:2:13',
						'no-trailing-zero/invalid.scss:6:13',
						'no-trailing-zero/invalid.scss:10:13'
					]
				},
				{
					name: 'no-vendor-prefixes',
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
					locations: [
						'placeholder-in-extend/invalid.scss:6:11'
					]
				},
				{
					name: 'placeholder-name-format',
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
					locations: [
						'shorthand-values/invalid.scss:2:13',
						'shorthand-values/invalid.scss:6:13',
						'shorthand-values/invalid.scss:10:13'
					]
				},
				{
					name: 'single-line-per-selector',
					locations: [
						'single-line-per-selector/invalid.scss:1:7'
					]
				},
				{
					name: 'space-after-colon',
					locations: [
						'space-after-colon/invalid.scss:2:12'
					]
				},
				{
					name: 'space-after-comma',
					locations: [
						'space-after-comma/invalid.scss:1:25',
						'space-after-comma/invalid.scss:6:23',
						'space-after-comma/invalid.scss:7:30'
					]
				},
				{
					name: 'space-before-brace',
					locations: [
						'space-before-brace/invalid.scss:1:4',
						'space-before-brace/invalid.scss:2:16',
						'space-before-brace/invalid.scss:7:10'
					]
				},
				{
					name: 'space-before-colon',
					locations: [
						'space-before-colon/invalid.scss:3:12'
					]
				},
				{
					name: 'space-between-parens',
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
					locations: [
						'trailing-semicolon/invalid.scss:4:19'
					]
				},
				{
					name: 'variable-name-format',
					locations: [
						'variable-name-format/invalid.scss:1:1',
						'variable-name-format/invalid.scss:3:1'
					]
				},
				{
					name: 'block-no-empty',
					locations: [
      					'no-empty-rulesets/valid.scss:2:6',
      					'no-empty-rulesets/valid.scss:9:7',
      					'no-empty-rulesets/valid.scss:12:8'
					]
				},
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
				const s = new Set();
				for (const { name, locations } of expectedNotices) {
					locations.forEach(location => {
						const expectedPattern = new RegExp(
							`${location}[^\n]*Error[^\n]*${name}`
						);
						try {
							proclaim.match(
								error.message,
								expectedPattern,
								`Expected a "${name}" error from "${location}".`
							);
						} catch (error) {
							s.add(name);
						}
					});
				}
				console.log({ 'remaining rules to migrate': s.size, next: s.values().next().value});
				if (s.size) {
					throw new Error('linting errors were not as expected');
				}
			});
		});
	});
});
