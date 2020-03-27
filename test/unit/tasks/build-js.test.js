/* eslint-env mocha */
'use strict';

const proclaim = require('proclaim');
const fs = require('fs-extra');
const path = require('path');
const process = require('process');

const build = require('../../../lib/tasks/build-js');

const obtPath = process.cwd();
const oTestPath = 'test/unit/fixtures/o-test';

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

	it('should work with default options', function () {
		return build()
			.then(function (result) {
				proclaim.include(result, 'function Test()');
				proclaim.include(result, 'var name = \'test\'');
				proclaim.include(result, 'sourceMappingURL');
			});
	});

	it('should work with production option', function () {
		return build({
			production: true
		})
			.then(function (builtJs) {
				proclaim.doesNotInclude(builtJs, 'sourceMappingURL');
			});
	});

	it('should build from custom source', function () {
		return build({
			js: './src/js/test.js'
		})
			.then(function (builtJs) {
				proclaim.include(builtJs, 'sourceMappingURL');
				proclaim.include(builtJs, 'function Test()');
				proclaim.include(builtJs, 'var name = \'test\'');
			});
	});

	it('should build to a custom directory', function () {
		return build({
			buildFolder: 'test-build'
		})
			.then(function (builtJs) {
				proclaim.include(builtJs, 'sourceMappingURL');
				proclaim.include(builtJs, 'function Test()');
				proclaim.include(builtJs, 'var name = \'test\'');
			});
	});

	it('should build to a custom file', function () {
		return build({
			buildJs: 'bundle.js'
		})
			.then(function (builtJs) {
				proclaim.include(builtJs, 'sourceMappingURL');
				proclaim.include(builtJs, 'function Test()');
				proclaim.include(builtJs, 'var name = \'test\'');
			});
	});

	it('should fail on syntax error', function () {
		return build({
			js: './src/js/syntax-error.js'
		})
			.then(function () { }, function (e) { // eslint-disable-line no-empty-function
				proclaim.include(e.message, 'Error: failed to parse module');
			});
	});

	it('should fail when a dependency is not found', function () {
		return build({
			js: './src/js/missing-dep.js'
		})
			.then(function () {}, function (e) { // eslint-disable-line no-empty-function
				proclaim.include(e.message, 'Module not found: Error: Can\'t resolve \'dep\'');
			});
	});

	it('should support a standalone option which creates a global variable', function () {
		return build({
			standalone: 'origami'
		})
			.then(function (builtJs) {
				proclaim.include(builtJs, 'sourceMappingURL');
				proclaim.include(builtJs, 'function Test()');
				proclaim.include(builtJs, 'var name = \'test\'');
				proclaim.include(builtJs, 'var origami =\n');
			});
	});
});
