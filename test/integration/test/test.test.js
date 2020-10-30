
/* eslint-env mocha */
'use strict';

const execa = require('execa');
const path = require('path');
const process = require('process');
const rimraf = require('../helpers/delete');
const obtBinPath = require('../helpers/obtpath');

describe('obt test', function () {

	this.timeout(10 * 1000);
	const npmPath = path.join(__dirname, '/fixtures/with-npm-dependency-installed');

	before(function () {
		return obtBinPath()
			.then((obt) => {
				// Install npm fixtures.
				process.chdir(npmPath);
				return execa(obt, ['install']);
			});
	});

	after(function () {
		// Clear installs and correct path.
		return rimraf(path.join(npmPath, '/node_modules'))
			.then(() => process.chdir(process.cwd()));
	});

	it('passes Sass compilation tests for a component installed via npm', function () {
		process.chdir(npmPath);

		return obtBinPath()
			.then(obt => {
				return execa(obt, ['test']);
			})
			.catch((e) => {
				throw new Error(`Test command failed: ${e.stdout}`);
			});
	});
});
