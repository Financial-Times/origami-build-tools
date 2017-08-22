'use strict';

const Listr = require('listr');
const bowerInstall = require('./install-bower');
const npmInstall = require('./install-npm');

module.exports = function (cfg) {
	cfg = cfg || {};
	const config = cfg.flags || {};
	config.cwd = config.cwd || process.cwd();

	return new Listr([
		bowerInstall(config),
		npmInstall(config)
	], {
		renderer: require('../helpers/listr-renderer')
	}).run();
};

module.exports.watchable = false;
