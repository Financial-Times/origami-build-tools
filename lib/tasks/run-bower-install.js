'use strict';

const commandLine = require('../helpers/command-line');

module.exports = function runBowerInstall(options) {
	return commandLine.run('bower', [
		'install',
		'--config.registry.search=https://origami-bower-registry.ft.com',
		'--config.registry.search=https://registry.bower.io'
	], options);
};
