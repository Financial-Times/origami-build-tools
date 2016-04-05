'use strict';

const fs = require('fs');
const path = require('path');
const commandLine = require('../helpers/command-line');
const files = require('../helpers/files');
const log = require('../helpers/log');

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
		return Promise.all([
			module.exports.npmTest(),
			runSilentModeTest(gulp)
		])
		.then(function() {
			if (config.browserTest) {
				return module.exports.browserTest(gulp, config).then(function(){
					resolve();
				}).catch(function () {
					if(config.browserTestFailBuild){
						reject('Browser tests failed');
					} else {
						resolve();
					}
				});
			} else {
				resolve();
			}
		}).catch(function(error) {
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
		}
	});
};

function pollHeroku(appUrl) {
	return new Promise(function(resolve, reject) {
			let timeout;
			let checker;
			function checkUrl() {
				fetch(appUrl, {
						timeout: 2000,
						follow: 0
					})
					.then(function(response) {
						if (response.ok) {
							clearTimeout(timeout);
							clearInterval(checker);
							resolve();
						}
					});
			}
			checker = setInterval(checkUrl, 3000);
			timeout = setTimeout(function() {
				reject(appUrl + ' not responding with an ok response within 2 minutes');
				clearInterval(checker);
			}, 2 * 60 * 1000);
		});
}

module.exports._runBrowserTest = function(config) {
	return new Promise(function(resolve, reject) {
		const nightwatchCommand = path.resolve('.', 'node_modules/nightwatch/bin/nightwatch');

		const nightwatchConfigPath = config.nightwatchConfig;
		const environments = config.environments || 'chrome_latest,chrome_latest-1,firefox_latest,firefox_latest-1,ie8_Grid,ie9_Grid,ie10_Grid,ie11_Grid,safari8_Grid';
		const testsPath = config.testsPath || 'test/browser/tests';

		fs.readFile(nightwatchConfigPath, 'utf8', function(err, configContent) {
			if (err) {
				reject(err);
			}

			configContent = JSON.parse(configContent);
			configContent.test_settings.default.launch_url = config.testUrl; // eslint-disable-line camelcase

			const tempNightwatchConfigPath = nightwatchConfigPath.replace('json', 'tmp.json');

			fs.writeFile(tempNightwatchConfigPath, JSON.stringify(configContent), 'utf8', function(error) {
				if (error) {
					reject(error);
				}
				const nightwatchCommandResult = commandLine.run(nightwatchCommand, [
						'--group', testsPath,
						'--config', tempNightwatchConfigPath,
						'--env', environments
				]);
				if(config.browserTestFailBuild){
					nightwatchCommandResult.then(resolve, reject);
				} else {
					resolve(nightwatchCommandResult);
				}
			});
		});
	});
};

module.exports.browserTest = function(gulp, config) {
	const haikro = {
		build: require('haikro/lib/build'),
		create: require('haikro/lib/create'),
		deploy: require('haikro/lib/deploy'),
		destroy: require('haikro/lib/destroy'),
		logger: require('haikro/lib/logger')
	};
	const demo = require('./demo');

	config = config || {};
	config.nightwatchConfig = config.nightwatchConfig || path.resolve('.', 'test/browser/nightwatch.json');

	const packageJsonContent = fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8');
	let appName = files.getModuleName();
	let token;
	let commit;

	function cleanupTest(output) {
		try {
			fs.unlinkSync('Procfile');
			fs.unlinkSync(config.nightwatchConfig.replace('json', 'tmp.json'));
		} catch (e) {
			// Suppress errors
		}
		fs.writeFileSync(path.join(process.cwd(), 'package.json'), packageJsonContent, 'utf8');

		if (output && output.stdout) {
			log.secondary(output.stdout);
		}

		return haikro.destroy({
			token: token,
			app: appName
			// Suppress any errors
		});
	}
	return Promise.all([
		process.env.HEROKU_AUTH_TOKEN ? Promise.resolve(process.env.HEROKU_AUTH_TOKEN) : commandLine.run('heroku', ['auth:token']),
		commandLine.run('git', ['rev-parse', 'HEAD']),
		commandLine.run('npm', ['install', '--save', 'http-server']),
		demo(gulp, { local: true })
	])
	.then(function(results) {
		token = results[0].stdout ? results[0].stdout.trim() : results[0].trim();
		commit = results[1].stdout.trim();
		appName = appName + commit.substr(0, 5);
		config.testUrl = config.testUrl || 'https://' + appName + '.herokuapp.com';
		return haikro.create({
			app: appName,
			region: 'us',
			organization: 'financial-times',
			token: token
		});
	})
	.then(function() {
		fs.writeFileSync('Procfile', 'web: http-server demos/local', 'utf8');
		return haikro.build({
			project: process.cwd()
		});
	})
	.then(function() {
		return haikro.deploy({
			app: appName,
			token: token,
			project: process.cwd(),
			commit: commit
		});
	})
	.then(function() {
		pollHeroku(config.testUrl);
	})
	.then(function() {
		return module.exports._runBrowserTest(config);
	})
	.then(function(output) {
		cleanupTest(output);
	})
	.catch(function(e) {
		return cleanupTest()
			.then(function() {
				if (typeof e.stdout !== 'undefined') {
					log.secondary(e.stdout);
					throw e.stderr;
				} else {
					throw e;
				}
			});
	});
};

module.exports.watchable = true;
module.exports.description = 'Test if Sass silent compilation follows the Origami specification';
