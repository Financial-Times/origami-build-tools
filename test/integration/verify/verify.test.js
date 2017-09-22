/* eslint-env mocha */
'use strict';

const execa = require('execa');
const path = require('path');
const process = require('process');
const proclaim = require('proclaim');
const obtBinPath = require('../helpers/obtpath');
const fileExists = require('../helpers/fileExists');
const rimraf = require('../helpers/delete');
const vm = require('vm');
const fs = require('fs');
const isEs5 = require('is-es5-syntax');
const isEs6 = require('is-es6-syntax');
const isEs7 = require('is-es7-syntax');
const currentVersion = require('node-version');

describe('obt verify', function () {

	this.timeout(60 * 1000);

	describe('js', function () {
		describe('component with no js', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/no-js-or-sass'));
			});

			afterEach(function () {
				// Change the current working directory back to the directory where you started running these tests from.
				process.chdir(process.cwd());
			});

			it('should not error', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['verify']);
					});
			});
		});

		describe('component with invalid js', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/js-invalid'));
			});

			afterEach(function () {
				// Change the current working directory back to the directory where you started running these tests from.
				process.chdir(process.cwd());
			});

			it('should error', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['verify']);
					})
					.then(() => {
						return Promise.reject(new Error('obt verify should error.'));
					}, () => {
						return Promise.resolve(); // obt verify exited with a non-zero exit code, which is what we expected.
					});
			});
		});

		describe('component with valid ES5 js', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/js-es5'));
			});

			afterEach(function () {
				// Change the current working directory back to the directory where you started running these tests from.
				process.chdir(process.cwd());
			});

			it('should not error', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['verify']);
					});
			});
		});

		describe('component with valid ES6 js', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/js-es6'));
			});

			afterEach(function () {
				// Change the current working directory back to the directory where you started running these tests from.
				process.chdir(process.cwd());
			});

			it('should not error', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['verify']);
					});
			});
		});

		describe('component with valid ES7 js', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/js-es7'));
			});

			afterEach(function () {
				// Change the current working directory back to the directory where you started running these tests from.
				process.chdir(process.cwd());
			});

			it('should not error', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['verify']);
					});
			});
		});

		describe('component with npm dependency', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/js-npm-dependency'));
			});

			afterEach(function () {
				return rimraf(path.join(process.cwd(), '/build'))
					.then(() => rimraf(path.join(process.cwd(), '/node_modules')))
					.then(() => process.chdir(process.cwd()));
			});

			it('should not error because of bad js in a npm dependency', function () {
				let obt;
				return obtBinPath()
					.then(obtPath => {
						obt = obtPath;
						return execa(obt, ['install']);
					})
					.then(() => {
						return execa(obt, ['verify']);
					});
			});
		});

		describe('component with bower dependency', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/js-bower-dependency'));
			});

			afterEach(function () {
				return rimraf(path.join(process.cwd(), '/build'))
					.then(() => rimraf(path.join(process.cwd(), '/bower_components')))
					.then(() => process.chdir(process.cwd()));
			});

			it('should not error because of bad js in a bower dependency', function () {
				let obt;
				return obtBinPath()
					.then(obtPath => {
						obt = obtPath;
						return execa(obt, ['install']);
					})
					.then(() => {
						return execa(obt, ['verify']);
					});
			});
		});
	});

	describe('sass', function () {
		describe('component with no sass', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/no-js-or-sass'));
			});

			afterEach(function () {
				// Change the current working directory back to the directory where you started running these tests from.
				process.chdir(process.cwd());
			});

			it('should not error', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['verify']);
					});
			});
		});

		describe('component with invalid sass', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/sass-invalid'));
			});

			afterEach(function () {
				// Change the current working directory back to the directory where you started running these tests from.
				process.chdir(process.cwd());
			});

			it('should error', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['verify']);
					})
					.then(() => {
						return Promise.reject(new Error('obt verify should error when trying to verify a component which has invalid sass.'));
					}, () => {
						return Promise.resolve(); // obt verify exited with a non-zero exit code, which is what we expected.
					});
			});
		});

		describe('component with valid sass', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/sass'));
			});

			afterEach(function () {
				// Change the current working directory back to the directory where you started running these tests from.
				process.chdir(process.cwd());
			});

			it('should not error', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['verify']);
					});
			});
		});

		describe('component with bower dependency', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/sass-bower-dependency'));
			});

			afterEach(function () {
				return rimraf(path.join(process.cwd(), '/build'))
					.then(() => rimraf(path.join(process.cwd(), '/bower_components')))
					.then(() => process.chdir(process.cwd()));
			});

			it('should not error because of bad sass in a bower dependency', function () {
				let obt;
				return obtBinPath()
					.then(obtPath => {
						obt = obtPath;
						return execa(obt, ['install']);
					})
					.then(() => {
						return execa(obt, ['verify']);
					});
			});
		});

		describe('component with npm dependency', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/sass-npm-dependency'));
			});

			afterEach(function () {
				return rimraf(path.join(process.cwd(), '/build'))
					.then(() => rimraf(path.join(process.cwd(), '/node_modules')))
					.then(() => process.chdir(process.cwd()));
			});

			it('should not error because of bad sass in an npm dependency', function () {
				let obt;
				return obtBinPath()
					.then(obtPath => {
						obt = obtPath;
						return execa(obt, ['install']);
					})
					.then(() => {
						return execa(obt, ['verify']);
					});
			});
		});
	});
});
