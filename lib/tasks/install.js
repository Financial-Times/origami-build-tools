'use strict';

const Listr = require('listr');
const bowerInstall = require('./install-bower');
const npmInstall = require('./npm-install');

module.exports = function () {
	return new Listr([
		bowerInstall,
		npmInstall
	]).run();
};

module.exports.watchable = false;
