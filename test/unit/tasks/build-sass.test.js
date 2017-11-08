/* eslint-env mocha */
'use strict';

const denodeify = require('denodeify');
const exec = denodeify(require('child_process').exec, function (err, stdout) {
	return [err, stdout];
});

const expect = require('expect.js');

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
				expect(builtCss).to.contain('div {\n  color: blue; }\n');
				expect(result).to.contain('div {\n  color: blue; }\n');
			});
	});

	it('should work with production option', function () {
		return build({
			production: true
		})
			.then(function (result) {
				const builtCss = fs.readFileSync('build/main.css', 'utf8');
				// blue doesn't need to change to hex as it is same amount of characters as #00f
				expect(builtCss).to.be('div{color:blue}');
				expect(result).to.be('div{color:blue}');
			});
	});

	it('should build from custom source', function () {
		return build({
			sass: './src/scss/test.scss'
		})
			.then(function (result) {
				const builtCss = fs.readFileSync('build/main.css', 'utf8');
				expect(builtCss).to.contain('p {\n  color: #000000; }\n');
				expect(result).to.contain('p {\n  color: #000000; }\n');
			});
	});

	it('should build to a custom directory', function () {
		return build({
			buildFolder: 'test-build'
		})
			.then(function (result) {
				const builtCss = fs.readFileSync('test-build/main.css', 'utf8');
				expect(builtCss).to.contain('div {\n  color: blue; }\n');
				expect(result).to.contain('div {\n  color: blue; }\n');
				return exec('rm -rf test-build');
			});
	});

	it('should build to a custom file', function () {
		return build({
			buildCss: 'bundle.css'
		})
			.then(function (result) {
				const builtCss = fs.readFileSync('build/bundle.css', 'utf8');
				expect(builtCss).to.contain('div {\n  color: blue; }\n');
				expect(result).to.contain('div {\n  color: blue; }\n');
			});
	});
});
