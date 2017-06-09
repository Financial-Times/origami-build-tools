'use strict';

const commandLine = require('../helpers/command-line');

module.exports = function runNpmInstall(outputStreams) {
	return commandLine.run('npm', ['install'], outputStreams);
};
