'use strict';

const fs = require('fs');
const path = require('path');
const commandLine = require('../helpers/command-line');
const files = require('../helpers/files');
const log = require('../helpers/log');
const url = require('url');

function silentCompilationTest(gulp, silent) {
	const sass = require('./build').sass;
	const silentSass = require('../plugins/gulp-silent-sass');

	return new Promise(function(resolve, reject) {
		if (files.getMainSassPath()) {
			files.getSassFilesList()
				.then(files.sassSupportsSilent)
				.then(function(supportsSilent) {
					if (supportsSilent) {
						const src = path.join(process.cwd(), '/main.scss');
						const sassVar = '$' + files.getBowerJson().name + '-is-silent: ' + silent + ';\n';

						const sassConfig = {
							sass: src,
							sassPrefix: sassVar,
							sassIncludePaths: ['.'],
							env: 'production',
							buildFolder: 'disabled'
						};

						return sass(gulp, sassConfig)
							.pipe(silentSass({silent: silent}))
							.on('error', function(err) {
								reject(err.message);
							})
							.on('end', function() {
								resolve(true);
							});
					} else {
						log.primary('This module doesn\'t support silent mode');
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

function runSilentModeTest(gulp) {
	return new Promise(function(resolve, reject) {
		module.exports.silentCompilation(gulp)
			.then(function() {
				resolve(module.exports.nonSilentCompilation(gulp));
			}).catch(function(error) {
				reject(error);
			});
	});
}

module.exports = function(gulp, config) {
	return new Promise(function(resolve, reject) {
		Promise.all([
			module.exports.npmTest(),
			runSilentModeTest(gulp),
			module.exports.pa11yTest(gulp, config),
			karmaTest(gulp, config)
		])
		.catch(function(error) {
			reject(error);
		});
	});
};

module.exports.silentCompilation = function(gulp) {
	return silentCompilationTest(gulp, true);
};

module.exports.nonSilentCompilation = function(gulp) {
	return silentCompilationTest(gulp, false);
};

module.exports.npmTest = function() {
	return new Promise(function(resolve, reject) {
		const packageJson = files.getPackageJson();
		if (packageJson && packageJson.scripts && packageJson.scripts.test) {
			commandLine.run('npm', ['test'])
				.then(function(output) {
					log.primary('Running "npm test"...');
					log.secondary(output.stdout);
					resolve();
				}, function(output) {
					log.primary('Running "npm test"...');
					log.secondary(output.stdout);
					reject(output.stderr);
				});
		} else {
			resolve();
		}
	});
};

module.exports.pa11yTest = function(gulp, config) {
	log.secondary('Running "pa11y test"...');
	config = config || {};
	const defaultSrc = path.join(process.cwd(), '/demos/local/pa11y.html');
	// ignoring by default warnings, notices and the href="#" error
	const defaultIgnore = ['WCAG2AA.Principle2.Guideline2_4.2_4_1.G1,G123,G124.NoSuchID', 'warning', 'notice'];
	const src = (config.pa11yPath !== undefined) ? url.parse(path.join(process.cwd(), config.pa11yPath)) : url.parse(defaultSrc);
	const ignore = (config.pa11yIgnore !== undefined) ? config.pa11yIgnore.split(';') : defaultIgnore;

	return new Promise(function(resolve, reject) {
		fs.readFile(src.href, function(err) {
			if (err === null) {
				const pa11y = require('pa11y');
				const pa11yCliReporter = require('pa11y/reporter/cli');

				const test = pa11y({
					log: {
						debug: console.log.bind(console),
						error: console.error.bind(console),
						info: console.info.bind(console)
					},
					ignore: ignore
				});
				src.href = src.protocol ? src.href : 'file://' + src.href;

				test.run(src.href, function(error, result) {
					if (error) {
						reject(error);
					} else {
						pa11yCliReporter.results(result, src.href);
						resolve(result);
					}
				});
			} else {
				log.secondary(`Could not open ${src.href}`);
				resolve();
			};
		});
	});
};

const karmaTest = function (gulp, config) {
	return constructBrowserDeps()
		.then(polyfillUrl => {
			return new Promise((resolve, reject) => {

				const cfg = require('karma').config;
				const path = require('path');

				const browserstack = config.flags.browserstack;

				const karmaConfig = browserstack ?
					cfg.parseConfig(path.join(__dirname, '../../config/karma.config.browserstack.js'))
					: cfg.parseConfig(path.join(__dirname, '../../config/karma.config.phantom.js'));

				karmaConfig.files.unshift(polyfillUrl);

				log.secondary('Starting karma server...');

				const Server = require('karma').Server;
				const server = new Server(karmaConfig, exitCode => {
					if (exitCode !== 0) {
						reject();
					} else {
						resolve();
					}
				});

				server.start(karmaConfig);
				log.secondary('Running karma tests...');
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

	return Promise.resolve(`https://polyfill.io/v2/polyfill.js?features=default&flags=gated&unknown=polyfill`);

}

module.exports.watchable = true;
