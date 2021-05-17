
/* eslint-env mocha */
'use strict';

const execa = require('execa');
const process = require('process');
const rimraf = require('../helpers/delete');
const obtBinPath = require('../helpers/obtpath');
const tmpdir = require('../helpers/tmpdir');
const proclaim = require('proclaim');

describe('obt test', function () {

	this.timeout(30 * 1000);
	let obt;
	let testDirectory;

	beforeEach(async function () {
		obt = await obtBinPath();
		testDirectory = await tmpdir('obt-test-task-');
		process.chdir(testDirectory);
	});

	afterEach(async function () {
		process.chdir(process.cwd());
		await rimraf(testDirectory);
	});

	describe('given a valid component', function () {

		beforeEach(async function () {
			const name = 'o-test-component';
			const tag = 'v2.2.9';
			await execa('git', ['clone', '--depth', 1, '--branch', tag, `https://github.com/Financial-Times/${name}.git`, './']);
			await execa(obt, ['install']);
		});

		it('passes', async function () {
			try {
				await execa(obt, ['test']);
			} catch (error) {
				throw new Error(`Test command failed: ${error}`);
			}
		});
	});

	describe('given a component with no primary Sass mixin', function () {

		beforeEach(async function () {
			const name = 'o-test-component';
			const tag = 'v2.2.17';
			await execa('git', ['clone', '--depth', 1, '--branch', tag, `https://github.com/Financial-Times/${name}.git`, './']);
			await execa(obt, ['install']);
		});

		it('fails', async function () {
			try {
				await execa(obt, ['test']);
				throw new Error('The test command did not throw an error as expected.');
			} catch (error) {
				proclaim.include(
					error.stdout,
					'primary mixin',
					'Failed but with an unexpected error message: ' + error.stdout
				);
			}
		});
	});

	describe('given a component which outputs CSS by default on @import', function () {

		beforeEach(async function () {
			const name = 'o-test-component';
			const tag = 'v2.2.18';
			await execa('git', ['clone', '--depth', 1, '--branch', tag, `https://github.com/Financial-Times/${name}.git`, './']);
			await execa(obt, ['install']);
		});

		it('fails', async function () {
			try {
				await execa(obt, ['test']);
				throw new Error('The test command did not throw an error as expected.');
			} catch (error) {
				proclaim.include(
					error.stdout,
					'CSS was output by default',
					'Failed but with an unexpected error message: ' + error.stdout
				);
			}
		});
	});
});
