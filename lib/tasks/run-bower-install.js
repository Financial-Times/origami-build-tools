'use strict';

const commandLine = require('../helpers/command-line');
const path = require('path');

module.exports = function runBowerInstall(options) {
	return commandLine.run('bower', [
		'install',
		'--config.registry.search=https://origami-bower-registry.ft.com',
		'--config.registry.search=https://registry.bower.io'
	], Object.assign({
		localDir: path.resolve(__dirname, '../../node_modules/.bin')
	},options));
};
