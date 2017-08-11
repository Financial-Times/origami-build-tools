'use strict';

const Listr = require('listr');
const buildDemo = require('./demo-build');

module.exports = function (cfg) {
	cfg = cfg || {};
	const config = cfg.flags || {};
	config.cwd = config.cwd || process.cwd();

	return new Listr([{
		title: 'Compiling Demos',
		task: () => {
			return buildDemo(config);
		}
	}], {
		renderer: require('../helpers/listr-renderer')
	})
		.run();
};

module.exports.watchable = true;
