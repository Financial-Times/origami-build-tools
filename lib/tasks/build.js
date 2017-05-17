'use strict';

const Listr = require('listr');
const buildJS = require('./build-js');
const buildSass = require('./build-sass');
const nodeSass = require('node-sass');

module.exports = function (config) {
	return new Listr([
		{
			title: 'Compiling JS',
			task: () => buildJS(config)
		},
		{
			title: 'Compiling Sass',
			task: (context, task) => {
				let output = '';
				config.sassFunctions = {
					'@warn': function (warning) {
						if (output) {
							output += '\n' + warning.getValue().replace(/\n/g, ' ');
						} else {
							output = warning.getValue().replace(/\n/g, ' ');
						}
						task.output = output;
						return nodeSass.NULL;
					}
				};
				return buildSass(config);
			}
		}
	], {
		renderer: require('../helpers/listr-renderer')
	}).run();
};

module.exports.watchable = true;
