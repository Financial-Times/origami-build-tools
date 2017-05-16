'use strict';

const path = require('path');
const semver = require('semver');
const which = require('which');
const writer = require('flush-write-stream');
const Listr = require('listr');

const commandLine = require('../helpers/command-line');
const files = require('../helpers/files');

const versions = {
	bower: '^1.4.1'
};

function getCommandVersion(command, versionFlag) {
	return new Promise(function (resolve, reject) {
		commandLine.run(command, [versionFlag], {
			stdout: false,
			stderr: false
		})
			.then(function (output) {
				const re = new RegExp(/\d+(\.\d+)+/);
				const version = output.stdout.trim().match(re);

				if (version) {
					resolve(version[0]);
				} else {
					// Craft an error message, although the command returned successfully,
					// parsing of the version failed.
					reject(new Error('Could not get version for command `' +
						command + ' ' + versionFlag +
						'`.  Running command output: ' +
						output.stderr + '\n' + output.stdout
					));
				}
			}, function () {
				resolve(-1);
			});
	});
}

function getBowerCommand() {
	return new Promise(function (resolve, reject) {
		which('bower', function (err, bowerPath) {
			if (err || !bowerPath) {
				files.getNodeModulesDirectoryInUse()
					.then(function (modulespath) {
						const bowerCommand = path.join(modulespath, '/.bin/bower');
						resolve(bowerCommand);
					}, function (error) {
						reject(error);
					});
			} else {
				resolve(bowerPath);
			}
		});
	});
}

function getInstalledBowerVersion() {
	// Check to see if bower is installed
	return getBowerCommand().then(function (bowerCommand) {
		return getCommandVersion(bowerCommand, '--version');
	}, function (error) {
		return new Promise(function (resolve, reject) {
			reject(error);
		});
	});
}

function installBower() {
	return getInstalledBowerVersion()
		.then(function (version) {
			if (version === -1 || !semver.satisfies(version, versions.bower)) {
				return commandLine.run('npm', ['install', '-g', 'bower@' + versions.bower], {
					stdout: false,
					stderr: false
				});
			}
		});
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
				task: (context, task) => installBower()
					.then(() => runBowerInstall(task))
			}
		]);
	},
	skip: () => {
		if (!files.bowerJsonExists()) {
			return 'No bower.json found.';
		}
	}
};
