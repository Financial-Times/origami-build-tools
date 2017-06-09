'use strict';

const writer = require('flush-write-stream');
const Listr = require('listr');

const files = require('../helpers/files');
const runNpmInstall = require('./run-npm-install');

module.exports = {
	title: 'Installing NPM components',
	task: () => {
		return new Listr([{
			title: 'Starting NPM',
			task: (task) => runNpmInstall({
				stdout: false,
				stderr: writer(function write(data, enc, cb) {
					task.title = data.toString();
					cb();
				})
			})
		}]);
	},
	skip: function () {
		return files.packageJsonExists()
			.then(exists => {
				if (!exists) {
					return 'No package.json found.';
				}
			});
	}
};
