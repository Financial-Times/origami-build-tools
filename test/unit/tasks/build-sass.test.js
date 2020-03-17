/* eslint-env mocha */
'use strict';

const denodeify = require('denodeify');
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
				proclaim.include(builtCss, 'div {\n  color: blue;\n}\n');
				proclaim.include(result, 'div {\n  color: blue;\n}\n');
			});
	});

	it('should work with production option', function () {
		return build({
			production: true
		})
			.then(function (result) {
				const builtCss = fs.readFileSync('build/main.css', 'utf8');
				// blue doesn't need to change to hex as it is same amount of characters as #00f
				proclaim.equal(builtCss, 'div{color:blue}', 'Sass build did not write css to file.');
				proclaim.equal(result, 'div{color:blue}', 'Sass build did not return css.');
			});
	});

	it('should build from custom source', function () {
		return build({
			sass: './src/scss/test.scss'
		})
			.then(function (result) {
				const builtCss = fs.readFileSync('build/main.css', 'utf8');
				proclaim.include(builtCss, 'p {\n  color: #000000;\n}\n');
				proclaim.include(result, 'p {\n  color: #000000;\n}\n');
			});
	});

	it('should build to a custom directory', function () {
		return build({
			buildFolder: 'test-build'
		})
			.then(function (result) {
				const builtCss = fs.readFileSync('test-build/main.css', 'utf8');
				proclaim.include(builtCss, 'div {\n  color: blue;\n}\n');
				proclaim.include(result, 'div {\n  color: blue;\n}\n');
				return exec('rm -rf test-build');
			});
	});

	it('should build to a custom file', function () {
		return build({
			buildCss: 'bundle.css'
		})
			.then(function (result) {
				const builtCss = fs.readFileSync('build/bundle.css', 'utf8');
				proclaim.include(builtCss, 'div {\n  color: blue;\n}\n');
				proclaim.include(result, 'div {\n  color: blue;\n}\n');
			});
	});


	it('should set the brand variable', function () {
		return build({
			buildCss: 'bundle.css',
			brand: 'internal'
		})
			.then(function (result) {
				const builtCss = fs.readFileSync('build/bundle.css', 'utf8');
				proclaim.include(builtCss, 'div {\n  content: Brand is set to internal;\n  color: blue;\n}\n');
				proclaim.include(result, 'div {\n  content: Brand is set to internal;\n  color: blue;\n}\n');
			});
	});
});
