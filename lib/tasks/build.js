'use strict';

const Listr = require('listr');
const ListrMultilineRenderer = require('listr-multiline-renderer');
const buildJS = require('./build-js');
const buildSass = require('./build-sass');
const denodeify = require('util').promisify;
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
		task: () => {
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
		renderer: ListrMultilineRenderer,
		collapse: false,
		showSubtasks: true,
		concurrent: true
	}).run();
};

module.exports.watchable = true;
