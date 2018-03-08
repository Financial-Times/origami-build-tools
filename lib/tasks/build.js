'use strict';

const Listr = require('listr');
const buildJS = require('./build-js');
const buildSass = require('./build-sass');
const nodeSass = require('node-sass');
const denodeify = require('denodeify');
const deglob = denodeify(require('deglob'));

module.exports = function (cfg) {
	cfg = cfg || {};
	const config = cfg.flags || {};
	config.cwd = config.cwd || process.cwd();

	return new Listr([{
		title: 'Compiling JS',
		task: () => buildJS(config),
		skip: () => {
			const opts = {
				useGitIgnore: true,
				usePackageJson: false,
				cwd: config.cwd
			};

			return deglob(['**/*.js'], opts)
				.then(function (files) {
					if (files.length === 0) {
						return 'No Javascript files found.';
					} else {
						return false;
					}
				})
				.catch(() => false);
		}
	},
	{
		title: 'Compiling Sass',
		task: (context, task) => {
			// Only include sass warnings with the verbose flag.
			if (!config.verbose) {
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
			}
			return buildSass(config);
		},
		skip: () => {
			const opts = {
				useGitIgnore: true,
				usePackageJson: false,
				cwd: config.cwd
			};

			return deglob(['**/**.scss', '**/**.sass'], opts)
				.then(function (files) {
					if (files.length === 0) {
						return 'No Sass files found.';
					} else {
						return false;
					}
				})
				.catch(() => false);
		}
	}], {
		renderer: require('../helpers/listr-renderer')
	}).run();
};

module.exports.watchable = true;
