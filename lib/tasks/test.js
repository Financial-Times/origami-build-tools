'use strict';

const path = require('path');
const commandLine = require('../helpers/command-line');
const files = require('../helpers/files');
const pa11y = require('./pa11y');

function silentCompilationTest(gulp, silent) {
	const sass = require('./build').sass;
	const silentSass = require('../plugins/gulp-silent-sass');
	const nodeSass = require('node-sass');

	return new Promise(function(resolve, reject) {
		if (files.getMainSassPath()) {
			files.getSassFilesList()
				.then(files.sassSupportsSilent)
				.then(function(supportsSilent) {
					if (supportsSilent) {
						const src = path.join(process.cwd(), '/main.scss');
						const sassVar = '$' + files.getBowerJson().name + '-is-silent: ' + silent + ';';

						const sassConfig = {
							sass: src,
							sassPrefix: sassVar,
							sassIncludePaths: ['.'],
							env: 'production',
							buildFolder: 'disabled',
							sassFunctions: {
								'@warn': function () {
									return nodeSass.NULL;
								}
							}
						};

						return sass(gulp, sassConfig)
							.pipe(silentSass({silent: silent}))
							.on('error', () => {
								if (silent) {
									reject(new Error(`When compiling with \`${sassVar}\` styles were output when they should not have been`));
								} else {
									reject(new Error(`When compiling with \`${sassVar}\` no styles were output when the should have been`));
								}
							})
							.on('end', function() {
								resolve(true);
							});
					} else {
						resolve();
					}
				}, function(err) {
					reject(err);
				});
		} else {
			resolve();
		}
	});
}

function runSilentModeTest (gulp) {
	return silentCompilation(gulp)
		.then(() => nonSilentCompilation(gulp));
}

const silentCompilation = function(gulp) {
	return silentCompilationTest(gulp, true);
};

const nonSilentCompilation = function(gulp) {
	return silentCompilationTest(gulp, false);
};

const npmTest = function () {
	return commandLine.run('npm', ['test']);
};

const karmaTest = function (useBrowserStack, task) {
	return constructBrowserDeps()
		.then(polyfillUrl => {
			return new Promise((resolve, reject) => {

				const cfg = require('karma').config;
				const path = require('path');

				const karmaConfig = useBrowserStack ?
					cfg.parseConfig(path.join(__dirname, '../../config/karma.config.browserstack.js'))
					: cfg.parseConfig(path.join(__dirname, '../../config/karma.config.phantom.js'));

				const errors = [];
				karmaConfig.files.unshift(polyfillUrl);
				karmaConfig.plugins.unshift(require('../plugins/listr-karma')(errors));
				karmaConfig.reporters.push('listr');

				const Server = require('karma').Server;
				const server = new Server(karmaConfig, exitCode => {
					if (exitCode !== 0) {
						reject(new Error(`Failed Karma tests: ${'\n\n' + errors.join('\n\n')}`));
					} else {
						resolve();
					}
				});

				server.on('browser_start', function (browser) {
					task.title = `Starting tests on ${browser.name}`;
				});

				server.on('browser_register', function (browser) {
					task.title = `Running tests on ${browser.name}`;
				});

				server.on('browser_complete', function (browser) {
					task.title = `Completed tests on ${browser.name}`;
				});

				server.on('browser_error', function (browser, error) {
					task.title = `Error with ${browser.name}`;
					reject(new Error(`Error connecting to ${browser.name}: ${error.toString()}`));
				});

				server.on('browser_register', function (browser) {
					task.title = `Opening ${browser.name}`;
				});


				server.start(karmaConfig);

				task.title = 'Starting Karma server';
			});
		});
};

function constructBrowserDeps () {
	const globby = require('globby');
	const bower = files.getBowerJson();

	if (bower) {
		return globby(['bower_components/*/origami.json', 'origami.json'])
			.then(dependencies => {
				const requiredFeatures = [];

				for (const dependency of dependencies) {
					const origami = require(path.resolve(dependency));
					if (origami.browserFeatures && origami.browserFeatures.required) {
						requiredFeatures.push(...origami.browserFeatures.required);
					}
				}

				const features = Array.from(new Set(requiredFeatures));
				return `https://polyfill.io/v2/polyfill.js?features=default,${features.join(',')}&flags=gated&unknown=polyfill`;
			});
	}

	return Promise.resolve('https://polyfill.io/v2/polyfill.js?features=default&flags=gated&unknown=polyfill');

}

module.exports = function (gulp, config) {
	const Listr = require('listr');

	return new Listr(
		[
			{
				title: 'Testing SCSS silent styles',
				task: () => runSilentModeTest(gulp),
				skip: () => !files.getMainSassPath()
			},
			{
				title: 'Executing `npm test`',
				task: npmTest,
				skip: () => {
					const packageJson = files.getPackageJson();
					return !(packageJson && packageJson.scripts && packageJson.scripts.test);
				}
			},
			pa11y,
			{
				title: 'Running Karma tests',
				task: (context, task) => {

					if (config.flags.browserstack) {
						task.title = 'Running Karma tests on BrowserStack';
					} else {
						task.title = 'Running Karma tests on PhantomJS';
					}

					return new Listr([
						{
							title: 'Tests starting...',
							task: (context, task) => karmaTest(config.flags.browserstack, task)
						}
					]);
				}
			}
		]
	)
	.run();
};

module.exports.watchable = true;
module.exports.description = 'Test if Sass silent compilation follows the Origami specification';
