/* eslint-env mocha */
'use strict';

const expect = require('expect.js');
const proclaim = require('proclaim');
const fs = require('fs-extra');
const path = require('path');
const process = require('process');

const build = require('../../lib/tasks/build-js');

const obtPath = process.cwd();
const oTestPath = 'test/fixtures/o-test';

describe('build-js', function () {
	const pathSuffix = '-build-js';
	const buildTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

	beforeEach(function () {
		fs.copySync(path.resolve(obtPath, oTestPath), buildTestPath);
		process.chdir(buildTestPath);
		fs.writeFileSync('bower.json', JSON.stringify({
			name: 'o-test',
			main: 'main.js'
		}), 'utf8');
	});

	afterEach(function () {
		process.chdir(obtPath);
		fs.removeSync(buildTestPath);
		return fs.emptydirSync('build', function () {
			fs.removeSync('build');
		});
	});

	it.only('should work with default options', function () {
		return build()
			.then(function (result) {
				proclaim.match(result, /^\/\*\*\*\*\*\*\/ \(function\(modules\)/);
				expect(result).to.contain('sourceMappingURL');
				expect(result).to.contain('var Test');
				expect(result).to.contain('function Test() {\n\tvar name = \'test\';');
				expect(result).to.contain('module.exports = "This is a test\\n"');
				expect(result).to.contain('\n\nmodule.exports = {\n\t"test": true\n};');
			});
	});

	it('should work with production option', function () {
		return build({
			flags: {
				production: true
			}
		})
			.then(function (builtJs) {
				expect(builtJs).to.not.contain('sourceMappingURL');
				expect(builtJs).to.not.contain('var Test');
				expect(builtJs).to.not.contain('function Test() {\n\tvar name = \'test\';');
				expect(builtJs).to.not.contain('"This is a test"');
				expect(builtJs).to.not.contain('function Test() {\n\tvar name = \'test\';');
			});
	});

	it('should build from custom source', function () {
		return build({
			flags: {
				js: './src/js/test.js'
			}
		})
			.then(function (builtJs) {
				expect(builtJs).to.contain('sourceMappingURL');
				expect(builtJs).to.not.contain('var Test');
				expect(builtJs).to.contain('function Test() {\n\tvar name = \'test\';');
			});
	});

	it('should build to a custom directory', function () {
		return build({
			flags: {
				buildFolder: 'test-build'
			}
		})
			.then(function (builtJs) {
				expect(builtJs).to.contain('sourceMappingURL');
				expect(builtJs).to.contain('var Test');
				expect(builtJs).to.contain('function Test() {\n\tvar name = \'test\';');
				expect(builtJs).to.contain('module.exports = "This is a test\\n"');
				expect(builtJs).to.contain('function Test() {\n\tvar name = \'test\';');
			});
	});

	it('should build to a custom file', function () {
		return build({
			flags: {
				buildJs: 'bundle.js'
			}
		})
			.then(function (builtJs) {
				expect(builtJs).to.contain('sourceMappingURL');
				expect(builtJs).to.contain('var Test');
				expect(builtJs).to.contain('function Test() {\n\tvar name = \'test\';');
				expect(builtJs).to.contain('module.exports = "This is a test\\n"');
				expect(builtJs).to.contain('function Test() {\n\tvar name = \'test\';');
			});
	});

	it('should fail on syntax error', function () {
		return build({
			flags: {
				js: './src/js/syntax-error.js'
			}
		})
			.then(function () {}, function (e) { // eslint-disable-line no-empty-function
				expect(e.message).to.contain('SyntaxError');
				expect(e.message).to.contain('Unexpected token');
			});
	});

	it('should fail when a dependency is not found', function () {
		return build({
			flags: {
				js: './src/js/missing-dep.js'
			}
		})
			.then(function () {}, function (e) { // eslint-disable-line no-empty-function
				expect(e.message).to.contain('Module not found: Error: Can\'t resolve \'dep\'');
			});
	});

	it('should support a standalone option which creates a global variable', function () {
		return build({
			flags: {
				standalone: 'origami'
			}
		})
			.then(function (builtJs) {
				expect(builtJs).to.contain('sourceMappingURL');
				expect(builtJs).to.contain('var Test');
				expect(builtJs).to.contain('function Test() {\n\tvar name = \'test\';');
				expect(builtJs).to.contain('module.exports = "This is a test\\n"');
				expect(builtJs).to.contain('\nmodule.exports = {\n\t"test": true\n};');
				expect(builtJs).to.contain('var origami =\n');
			});
	});
});
