'use strict';

const writer = require('flush-write-stream');
const Listr = require('listr');

const commandLine = require('../helpers/command-line');
const files = require('../helpers/files');

function getBowerCommand() {
	return Promise.resolve(require.resolve('bower/bin/bower'));
}

function runBowerInstall(task) {
	return getBowerCommand()
		.then(function (command) {
			return commandLine.run(command, [
				'install',
				'--config.registry.search=http://registry.origami.ft.com',
				'--config.registry.search=https://bower.herokuapp.com'
			], {
				stdout: writer(function write(data, enc, cb) {
					task.title = data.toString();
					cb();
				}),
				stderr: false
			});
		});
}

module.exports = {
	title: 'Installing Bower components',
	task: () => {
		return new Listr([
			{
				title: 'Starting Bower',
				task: (context, task) => runBowerInstall(task)
			}
		]);
	},
	skip: () => {
		if (!files.bowerJsonExists()) {
			return 'No bower.json found.';
		}
	}
};
