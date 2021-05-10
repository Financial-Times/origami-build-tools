'use strict';

const commandLine = require('../helpers/command-line');

module.exports = function runNpmInstall(options = {}) {
	return commandLine.run('npm', ['install'], options);
};
