
/* eslint-env mocha */
'use strict';

const execa = require('execa');
const path = require('path');
const process = require('process');
const rimraf = require('../helpers/delete');
const obtBinPath = require('../helpers/obtpath');
const fs = require('fs');
const { promisify } = require('util');
const mkdtemp = promisify(fs.mkdtemp);
const os = require('os');

describe('obt test', function () {

	this.timeout(30 * 1000);
	let obt;
	let testDirectory;

	beforeEach(async function () {
		obt = await obtBinPath();
		testDirectory = await mkdtemp(path.join(os.tmpdir(), 'obt-test-'));
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
				throw new Error(`Test command failed: ${error.stdout}`);
			}
		});
	});
});
