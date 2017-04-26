'use strict';

const commandLine = require('../helpers/command-line');
const files = require('../helpers/files');
const pa11y = require('./pa11y');
const karma = require('./karma');
const sass = require('./sass');

const npmTest = function () {
	return commandLine.run('npm', ['test']);
};

module.exports = function (gulp, config) {
	const Listr = require('listr');

	return new Listr(
		[
			sass,
			{
				title: 'Executing `npm test`',
				task: npmTest,
				skip: () => {
					const packageJson = files.getPackageJson();
					return !(packageJson && packageJson.scripts && packageJson.scripts.test);
				}
			},
			pa11y,
			karma(config.flags.browserstack)
		]
	)
	.run();
};

module.exports.watchable = true;
