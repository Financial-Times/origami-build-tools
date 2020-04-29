/* eslint-env mocha */
'use strict';

const denodeify = require('util').promisify;
const exec = denodeify(require('child_process').exec, function (err, stdout) {
	return [err, stdout];
});

const proclaim = require('proclaim');
const sinon = require('sinon');

const fs = require('fs-extra');
const path = require('path');
const process = require('process');

const build = require('../../../lib/tasks/build-sass');
const log = require('../../../lib/helpers/log');

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

	it('outputs warnings and debug messages when verbose mode is enabled', function () {
		const debugMessage = `This is a debug message!`;
		const warningMessage = `This is a warning!`;
		const debugSass = `@debug "${debugMessage};";`;
		const warningSass = `@warn "${warningMessage};";`;
		const logSpy = sinon.spy(log, 'secondary');
		return build({
			buildCss: 'bundle.css',
			sassPrefix: debugSass + warningSass,
			verbose: true
		})
			.then(() => {
				proclaim.isTrue(logSpy.calledWithMatch(debugMessage), 'Did not log Sass debug messages.');
				proclaim.isTrue(logSpy.calledWithMatch(warningMessage), 'Did not log Sass warnings.');
				logSpy.restore();
			});
	});

	it('does not output warnings or debug messages when verbose mode is not enabled', function () {
		const debugMessage = `This is a debug message!`;
		const warningMessage = `This is a warning!`;
		const debugSass = `@debug "${debugMessage};";`;
		const warningSass = `@warn "${warningMessage};";`;
		const logSpy = sinon.spy(log, 'secondary');
		return build({
			buildCss: 'bundle.css',
			sassPrefix: debugSass + warningSass,
			verbose: false
		})
			.then(() => {
				proclaim.isFalse(logSpy.calledWithMatch(debugMessage), 'Logged Sass debug messages unexpectedly.');
				proclaim.isFalse(logSpy.calledWithMatch(warningMessage), 'Logged Sass warnings unexpectedly.');
				logSpy.restore();
			});
	});

	it('should parse errors to provide an absolute file path with line number', function () {
		const invalidSass = `¯\_(ツ)_/¯!`;
		fs.writeFileSync('src/scss/_variables.scss',
			invalidSass,
			'utf8'
		);
		return build({
			buildCss: 'bundle.css'
		})
			.then(() => {
				throw new Error('Expected build promise to reject.');
			})
			.catch((error) => {
				proclaim.include(error.message, path.resolve(buildTestPath, 'src/scss/_variables.scss:1:9'));
				proclaim.include(error.message, invalidSass);
			});
	});

	it('should show Sass error message when unable to parse an absolute file path and line number', function () {
		const invalidSass = '¯\_(ツ)_/¯! prefix invalid sass with no file or line number to parse';
		return build({
			buildCss: 'bundle.css',
			sassPrefix: invalidSass
		})
			.then(() => {
				throw new Error('Expected build promise to reject.');
			})
			.catch((error) => {
				proclaim.include(error.message, 'root stylesheet');
				proclaim.include(error.message, invalidSass);
			});
	});

	it('should resolve imports relative to the sass entry point', function () {
		return build({
			sass: 'demos/src/demo-scss/demo.scss'
		})
			.then(function (result) {
				const builtCss = fs.readFileSync('build/main.css', 'utf8');
				proclaim.include(builtCss, 'div {\n  color: blue;\n}\n');
				proclaim.include(result, 'div {\n  color: blue;\n}\n');
			});
	});
});
