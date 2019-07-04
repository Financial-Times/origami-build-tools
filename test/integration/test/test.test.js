
/* eslint-env mocha */
'use strict';

const execa = require('execa');
const path = require('path');
const process = require('process');
const rimraf = require('../helpers/delete');
const obtBinPath = require('../helpers/obtpath');

describe('obt test', function () {

	this.timeout(10 * 1000);

	const bowerPath = path.join(__dirname, '/fixtures/with-bower-dependency-installed');
	const npmPath = path.join(__dirname, '/fixtures/with-npm-dependency-installed');

	before(function () {
		return obtBinPath()
			.then((obt) => {
				// Install npm fixtures.
				process.chdir(npmPath);
				return execa(obt, ['install', '--ignore-bower']);
			})
			.then(obtBinPath)
			.then((obt) => {
				// Install bower fixtures.
				process.chdir(bowerPath);
				execa(obt, ['install']);
			});
	});

	after(function () {
		// Clear installs and correct path.
		return rimraf(path.join(bowerPath, '/bower_components'))
			.then(() => rimraf(path.join(npmPath, '/node_modules')))
			.then(() => process.chdir(process.cwd()));
	});

	describe('with the --ignore-bower flag', function () {

		it('passes Sass compilation tests for a component installed via npm', function () {
			process.chdir(npmPath);

			return obtBinPath()
				.then(obt => {
					return execa(obt, ['test', '--ignore-bower']);
				})
				.catch((e) => {
					throw new Error(`Test command failed: ${e.stdout}`);
				});
		});


		it('fails Sass compilation tests for a component installed via bower', function (done) {
			process.chdir(bowerPath);
			obtBinPath()
				.then(obt => {
					return execa(obt, ['test', '--ignore-bower']);
				})
				.catch(() => {
					done();
				});
		});


	});

	describe('without the --ignore-bower flag', function () {

		it('passes Sass compilation tests for a component installed via bower', function () {
			process.chdir(bowerPath);
			return obtBinPath()
				.then(obt => {
					return execa(obt, ['test']);
				})
				.catch((e) => {
					throw new Error(`Test command failed: ${e.stdout}`);
				});
		});

		it('fails Sass compilation tests for a component installed via npm', function (done) {
			process.chdir(npmPath);
			obtBinPath()
				.then(obt => {
					return execa(obt, ['test']);
				})
				.catch(() => {
					done();
				});
		});

	});

});
