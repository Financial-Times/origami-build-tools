'use strict';

const process = require('process');
const writer = require('flush-write-stream');
const Listr = require('listr');

const files = require('../helpers/files');
const runNpmInstall = require('./run-npm-install');

module.exports = function (cfg) {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	return {
		title: 'Installing NPM components',
		task: () => {
			return new Listr([{
				title: 'Starting NPM',
				task: (task) => runNpmInstall({
					stdout: false,
					stderr: writer(function write(data, enc, cb) {
						task.title = data.toString();
						cb();
					}),
					cwd: config.cwd
				})
			}]);
		},
		skip: function () {
			return files.packageJsonExists(config.cwd)
				.then(exists => {
					if (!exists) {
						return 'No package.json found.';
					}
				});
		}
	};
};
