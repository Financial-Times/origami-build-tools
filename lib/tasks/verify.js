'use strict';

const Listr = require('listr');
const ListrRenderer = require('../helpers/listr-renderer');
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
			renderer: ListrRenderer,
			collapse: false,
			showSubtasks: true,
			concurrent: true
		}
	)
		.run();
};

module.exports.watchable = false;
