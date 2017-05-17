'use strict';

const Listr = require('listr');
const buildJS = require('./build-js');
const buildSass = require('./build-sass');

module.exports = function (config) {
	return new Listr([
		{
			title: 'Compiling JS',
			task: () => buildJS(config)
		},
		{
			title: 'Compiling Sass',
			task: () => buildSass(config)
		}
	]).run();
};

module.exports.watchable = true;
