'use strict';

const Listr = require('listr');
const buildDemo = require('./demo-build');

module.exports = function (config) {
	return new Listr([{
		title: 'Compiling Demos',
		task: () => buildDemo(config)
	}], {
		renderer: require('../helpers/listr-renderer')
	}).run();
};

module.exports.watchable = true;
