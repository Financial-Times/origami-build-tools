'use strict';

const Listr = require('listr');
const bowerInstall = require('./install-bower');
const npmInstall = require('./install-npm');

module.exports = function (cfg) {
	cfg = cfg || {};
	const config = cfg.flags || {};
	config.cwd = config.cwd || process.cwd();

	const npmTask = npmInstall(config);
	const bowerTask = bowerInstall(config);

	const tasks = [npmTask].concat(config.ignoreBower ? [] : bowerTask);

	return new Listr(tasks, {
		renderer: require('../helpers/listr-renderer')
	}).run();
};

module.exports.watchable = false;
