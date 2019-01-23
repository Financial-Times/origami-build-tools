'use strict';

const commandLine = require('../helpers/command-line');
const files = require('../helpers/files');

module.exports = function runNpmInstall(options = {}) {
	return files.packageLockJsonExists(options.cwd).then(packageLockJsonExists => {
		const command = packageLockJsonExists
			? ['ci']
			: ['install', '--no-shrinkwrap'];

		return commandLine.run('npm', command, options);
	});
};
