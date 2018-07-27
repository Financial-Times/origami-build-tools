/* eslint-env mocha */
'use strict';

const execa = require('execa');
const path = require('path');
const process = require('process');
const proclaim = require('proclaim');
const obtBinPath = require('../helpers/obtpath');
const fileExists = require('../helpers/fileExists');
const rimraf = require('../helpers/delete');

describe('obt boilerplate', function () {

	this.timeout(10 * 1000);

	describe('builds boilerplate tree structure', function () {
		describe('with component name', function () {
			const componentName = 'o-my-test';

			afterEach(function () {
				return rimraf(path.join(process.cwd(), componentName))
					.then(() => process.chdir(process.cwd()));
			});

			it('should build boilerplate folder', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['boilerplate', componentName]);
					})
					.then(() => {
						return fileExists(`${componentName}/src/js/${componentName}.js`);
					})
					.then(exists => {
						proclaim.ok(exists);
					});
			});

			it('should error if component folder exists', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['boilerplate', componentName]);
					})
					.then(obt => {
						return execa(obt, ['boilerplate', componentName]);
					})
					.then(() => {
						return Promise.reject(new Error('obt boilerplate should error instead of overwriting an existing file'));
					}, () => {
						return Promise.resolve(); // obt boilerplate exited with a non-zero exit code, which is what we expected.
					});
			});
		});

		describe('without component name', function () {
			const defaultName = 'o-component-boilerplate';

			afterEach(function () {
				return rimraf(path.join(process.cwd(), defaultName))
					.then(() => process.chdir(process.cwd()));
			});

			it('should build boilerplate folder', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['boilerplate']);
					})
					.then(() => {
						return fileExists(`${defaultName}/src/js/${defaultName}.js`);
					})
					.then(exists => {
						proclaim.ok(exists);
					});
			});

			it('should error if component folder exists', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['boilerplate']);
					})
					.then(obt => {
						return execa(obt, ['boilerplate']);
					})
					.then(() => {
						return Promise.reject(new Error('obt boilerplate should error instead of overwriting an existing file'));
					}, () => {
						return Promise.resolve(); // obt boilerplate exited with a non-zero exit code, which is what we expected.
					});
			});
		});
	});
});
