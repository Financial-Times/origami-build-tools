
/* eslint-env mocha */
'use strict';

const execa = require('execa');
const path = require('path');
const process = require('process');
const rimraf = require('../helpers/delete');
const obtBinPath = require('../helpers/obtpath');

describe('obt test', function () {

	this.timeout(10 * 1000);

	before(function () {
		return obtBinPath()
			.then((obt) => {
				// Install npm fixtures.
				process.chdir(path.join(__dirname, '/fixtures/with-npm-dependency-installed'));
				return execa(obt, ['install', '--ignore-bower']);
			})
			.then(obtBinPath)
			.then((obt) => {
				// Install bower fixtures.
				process.chdir(path.join(__dirname, '/fixtures/with-bower-dependency-installed'));
				execa(obt, ['install']);
			});
	});

	after(function () {
		// Clear npm install.
		process.chdir(path.join(__dirname, '/fixtures/with-npm-dependency-installed'));
		return rimraf(path.join(process.cwd(), '/node_modules'))
			.then(() => {
				// Clear bower install.
				process.chdir(path.join(__dirname, '/fixtures/with-bower-dependency-installed'));
				rimraf(path.join(process.cwd(), '/bower_components'));
			});
	});

	describe('with the --ignore-bower flag', function () {

		it('passes Sass compilation tests for a component installed via npm', function () {
			process.chdir(path.join(__dirname, '/fixtures/with-npm-dependency-installed'));

			return obtBinPath()
				.then(obt => {
					return execa(obt, ['install', '--ignore-bower']);
				})
				.then(obtBinPath)
				.then(obt => {
					return execa(obt, ['test', '--ignore-bower']);
				})
				.catch((e) => {
					throw new Error(`Test command failed: ${e.stdout}`);
				});
		});


		it('fails Sass compilation tests for a component installed via bower', function (done) {
			process.chdir(path.join(__dirname, '/fixtures/with-bower-dependency-installed'));
			obtBinPath()
				.then(obt => {
					return execa(obt, ['install', '--ignore-bower']);
				})
				.then(obtBinPath)
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
			process.chdir(path.join(__dirname, '/fixtures/with-bower-dependency-installed'));
			return obtBinPath()
				.then(obt => {
					return execa(obt, ['install']);
				})
				.then(obtBinPath)
				.then(obt => {
					return execa(obt, ['test']);
				})
				.catch((e) => {
					throw new Error(`Test command failed: ${e.stdout}`);
				});
		});

		it('fails Sass compilation tests for a component with an npm dependency', function (done) {
			process.chdir(path.join(__dirname, '/fixtures/with-npm-dependency-installed'));
			obtBinPath()
				.then(obt => {
					return execa(obt, ['install']);
				})
				.then(obtBinPath)
				.then(obt => {
					return execa(obt, ['test']);
				})
				.catch(() => {
					done();
				});
		});

	});

});
