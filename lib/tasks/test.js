'use strict';

module.exports = function (cfg) {
	const commandLine = require('../helpers/command-line');
	const files = require('../helpers/files');
	const pa11y = require('./pa11y');
	const karma = require('./karma');
	const getSassCompilationTests = require('./test-sass-compilation');
	const testSass = require('./test-sass');

	const npmTest = function (config) {
		return commandLine.run('npm', ['test'], config);
	};

	cfg = cfg || {};
	const config = cfg.flags || {};
	config.cwd = config.cwd || process.cwd();

	const Listr = require('listr');
	const ListrMultilineRenderer = require('listr-multiline-renderer');

	return getSassCompilationTests(config).then((compilationTests) => {
		return new Listr(
			[
				...compilationTests,
				testSass(config),
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
				renderer: ListrMultilineRenderer,
				collapse: false,
				showSubtasks: true,
				concurrent: true
			}
		).run();
	});
};

module.exports.watchable = true;
