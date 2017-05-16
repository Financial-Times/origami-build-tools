'use strict';

const writer = require('flush-write-stream');
const Listr = require('listr');

const commandLine = require('../helpers/command-line');
const files = require('../helpers/files');

function runNpmInstall(ctx, task) {
	return commandLine.run('npm', ['install'], {
		stdout: false,
		stderr: writer(function write(data, enc, cb) {
			task.title = data.toString();
			cb();
		})
	});
}

module.exports = {
	title: 'Installing NPM components',
	task: () => {
		return new Listr([{
			title: 'Starting NPM',
			task: runNpmInstall
		}]);
	},
	skip: () => {
		if (!files.packageJsonExists()) {
			return 'No package.json found.';
		}
	}
};
