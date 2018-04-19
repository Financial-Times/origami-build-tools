'use strict';

const commandLine = require('../helpers/command-line');
const files = require('../helpers/files');
const path = require('path');
const sassFile = path.join(__dirname, '/index.test.scss');
const sassTrue = require('sass-true');
sassTrue.runSass({file: sassFile}, describe, it); // eslint-disable-line no-undef

const trueTest = function (config) {
	return commandLine.run('mocha', ['test/sass'], config);
};

const Listr = require('listr');

module.exports = function (cfg) {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	return {
		title: 'Run True Tests',
		task: () => {
			return new Listr([{
				title: 'Executing true test',
				task: () => trueTest(config),
				skip: function () {
					return files.getMainSassTestPath(config.cwd)
						.then(exists => {
							if (!exists) {
								return 'No test/sass found';
							}
						});
				}
			}]);
		}
	};
};

module.exports.watchable = true;
