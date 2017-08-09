'use strict';

const commandLine = require('../helpers/command-line');
const files = require('../helpers/files');
const pa11y = require('./pa11y');
const karma = require('./karma');
const sass = require('./sass');

const npmTest = function (config) {
	return commandLine.run('npm', ['test'], config.cwd);
};

module.exports = function (cfg) {
	cfg = cfg || {};
	const config = cfg.flags || {};
	config.cwd = config.cwd || process.cwd();

	const Listr = require('listr');

	return new Listr(
		[
			sass(config),
			{
				title: 'Executing `npm test`',
				task: () => npmTest(config),
				skip: () => {
					return files.getPackageJson(config.cwd)
						.then(packageJson => {
							return !(packageJson && packageJson.scripts && packageJson.scripts.test);
						});
				}
			},
			pa11y(config),
			karma(config)
		], {
			renderer: require('../helpers/listr-renderer')
		}
	)
	.run();
};

module.exports.watchable = true;
