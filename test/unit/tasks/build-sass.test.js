/* eslint-env mocha */
'use strict';

const denodeify = require('util').promisify;
const exec = denodeify(require('child_process').exec, function (err, stdout) {
	return [err, stdout];
});

const proclaim = require('proclaim');

const fs = require('fs-extra');
const path = require('path');
const process = require('process');

const build = require('../../../lib/tasks/build-sass');

const obtPath = process.cwd();
const oTestPath = 'test/unit/fixtures/o-test';

describe('Build Sass', function () {
	const pathSuffix = '-build-sass';
	const buildTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

	beforeEach(function () {
		fs.copySync(path.resolve(obtPath, oTestPath), buildTestPath);
		process.chdir(buildTestPath);
		fs.writeFileSync('bower.json', JSON.stringify({
			name: 'o-test',
			main: 'main.scss'
		}), 'utf8');
	});

	afterEach(function () {
		process.chdir(obtPath);
		fs.removeSync(path.resolve(obtPath, buildTestPath));
		return exec('rm -rf build');
	});

	it('should work with default options', function () {
		return build()
			.then(function (result) {
				const builtCss = fs.readFileSync('build/main.css', 'utf8');
				proclaim.include(builtCss, 'div{color:#00f}');
				proclaim.include(result, 'div{color:#00f}');
			});
	});

	it('should build from custom source', function () {
		return build({
			sass: './src/scss/test.scss'
		})
			.then(function (result) {
				const builtCss = fs.readFileSync('build/main.css', 'utf8');
				proclaim.include(builtCss, 'p{color:#000}');
				proclaim.include(result, 'p{color:#000}');
			});
	});

	it('should build to a custom directory', function () {
		return build({
			buildFolder: 'test-build'
		})
			.then(function (result) {
				const builtCss = fs.readFileSync('test-build/main.css', 'utf8');
				proclaim.include(builtCss, 'div{color:#00f}');
				proclaim.include(result, 'div{color:#00f}');
				return exec('rm -rf test-build');
			});
	});

	it('should build to a custom file', function () {
		return build({
			buildCss: 'bundle.css'
		})
			.then(function (result) {
				const builtCss = fs.readFileSync('build/bundle.css', 'utf8');
				proclaim.include(builtCss, 'div{color:#00f}');
				proclaim.include(result, 'div{color:#00f}');
			});
	});


	it('should set the brand variable', function () {
		return build({
			buildCss: 'bundle.css',
			brand: 'internal'
		})
			.then(function (result) {
				const builtCss = fs.readFileSync('build/bundle.css', 'utf8');
				proclaim.include(builtCss, 'div{content:Brand is set to internal;color:#00f}');
				proclaim.include(result, 'div{content:Brand is set to internal;color:#00f}');
			});
	});
});
