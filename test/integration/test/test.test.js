
/* eslint-env mocha */
'use strict';

const execa = require('execa');
const path = require('path');
const os = require('os');
const process = require('process');
const rimraf = require('../helpers/delete');
const obtBinPath = require('../helpers/obtpath');
const fs = require('fs');
const { promisify } = require('util');
const mkdtemp = promisify(fs.mkdtemp);

describe('obt test', function () {

	this.timeout(30 * 1000);
	let obt;
	let testDirectory;

	beforeEach(async function () {
		obt = await obtBinPath();
		testDirectory = await mkdtemp(path.join(os.homedir(), 'obt-test-'));
		process.chdir(testDirectory);
	});

	afterEach(async function () {
		process.chdir(process.cwd());
		await rimraf(testDirectory);
	});

	describe('given a valid component', function () {

		beforeEach(async function () {
			await execa('git', ['clone', '--depth', '1', '--branch', 'v2.2.9', 'https://github.com/Financial-Times/o-test-component.git', './'], {stdout: 'inherit'});
			await execa(obt, ['install'], {stdout: 'inherit'});
		});

		it('passes', async function () {
			try {
				await execa(obt, ['test'], { stdout: 'inherit' });
			} catch (error) {
				throw new Error(`Test command failed: ${error}`);
			}
		});
	});
});
