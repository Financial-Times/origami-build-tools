'use strict';

const commandLine = require('../helpers/command-line');
const denodeify = require('denodeify');
const files = require('../helpers/files');
const fs = require('fs');
const path = require('path');
const writeFile = denodeify(fs.writeFile);
const unlink = denodeify(fs.unlink);
require('promise.prototype.finally').shim();

const trueTest = function (config) {
	const testRunner = path.join(config.cwd, 'test/scss/test-runner.js');
	return writeFile(testRunner, `
		const path = require('path');
		const sassFile = path.join(__dirname, 'index.test.scss');
		const sassTrue = require('${require.resolve('sass-true')}');
		sassTrue.runSass({file: sassFile}, describe, it);
	`)
		.then(() => commandLine.run('mocha', ['test/scss'], config))
		.finally(() => unlink(testRunner));
};

module.exports = function (cfg) {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	return {
		title: 'running true test',
		task: () => trueTest(config),
		skip: function () {
			return files.getSassTestFiles(config.cwd)
				.then(sassTestFiles => {
					if (sassTestFiles.length === 0) {
						return `No sass test files found in ./test/scss`;
					}
				});
		}
	};
};

module.exports.watchable = true;
