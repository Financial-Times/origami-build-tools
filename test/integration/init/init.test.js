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
		const defaultName = 'o-component-boilerplate';
		const plainDefaultName = 'component-boilerplate';

		describe('with component name', function () {
			const componentName = 'o-my-test';
			const plainComponentName = 'my-test';

			afterEach(function () {
				return rimraf(path.join(process.cwd(), componentName))
					.then(() => process.chdir(process.cwd()));
			});

			it('should build boilerplate folder', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['init', componentName]);
					})
					.then(() => {
						return fileExists(`${componentName}/src/js/${plainComponentName}.js`);
					})
					.then(exists => {
						proclaim.ok(exists);
					});
			});

			it('should error if component folder exists', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['init', componentName]);
					})
					.then(obt => {
						return execa(obt, ['init', componentName]);
					})
					.then(() => {
						return Promise.reject(new Error('obt init should error instead of overwriting an existing file'));
					}, () => {
						return Promise.resolve(); // obt init exited with a non-zero exit code, which is what we expected.
					});
			});
		});

		describe('without component name', function () {
			afterEach(function () {
				return rimraf(path.join(process.cwd(), defaultName))
					.then(() => process.chdir(process.cwd()));
			});

			it('should build init folder', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['init']);
					})
					.then(() => {
						return fileExists(`${defaultName}/src/js/${plainDefaultName}.js`);
					})
					.then(exists => {
						proclaim.ok(exists);
					});
			});
		});

		describe('obt install && demo && build && verify && test', () => {
			afterEach(function () {
				process.chdir('../');
				return rimraf(path.join(process.cwd(), defaultName))
					.then(() => process.chdir(process.cwd()));
			});

			it('should not error', function () {
				this.timeout (100 * 1000);
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['init'])
							.then(() => process.chdir(defaultName))
							.then(() => execa(obt, ['install']))
							.then(() => execa(obt, ['demo']))
							.then(() => execa(obt, ['build']))
							.then(() => execa(obt, ['verify']))
							.then(() => execa(obt, ['test']));
					}, () => {
						return Promise.resolve(); // obt init exited with a non-zero exit code, which is what we expected.
					});
			});
		});
	});
});
