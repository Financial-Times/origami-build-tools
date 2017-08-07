'use strict';

const Listr = require('listr');
const verifyOrigamiJsonFile = require('./verify-origami-json');
const verifyJavaScript = require('./verify-javascript');
const verifySass = require('./verify-sass');
const process = require('process');

module.exports = function (cfg) {
	cfg = cfg || {};
	const config = cfg.flags || {};
	config.cwd = config.cwd || process.cwd();
	return new Listr(
		[
			verifyOrigamiJsonFile(config),
			verifyJavaScript(config),
			verifySass(config)
		], {
			renderer: require('../helpers/listr-renderer')
		}
	)
	.run();
};

module.exports.watchable = false;
