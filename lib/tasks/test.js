'use strict';

var fs = require('fs');
var path = require('path');
var fs = require('fs');
var sass = require('gulp-ruby-sass');
var haikro = {
	build: require('haikro/lib/build'),
	create: require('haikro/lib/create'),
	deploy: require('haikro/lib/deploy'),
	destroy: require('haikro/lib/destroy'),
	logger: require('haikro/lib/logger')
};
var silentSass = require('../plugins/gulp-silent-sass.js');
var commandLine = require('../helpers/command-line');
var files = require('../helpers/files.js');
var log = require('../helpers/log.js');
var demo = require('./demo.js');

function silentCompilationTest(gulp, silent) {
	return new Promise(function(resolve, reject) {
		if (files.getMainSassPath()) {
			files.getSassFilesList()
				.then(files.sassSupportsSilent)
				.then(function(supportsSilent) {
					if (supportsSilent) {
						var src = path.join(process.cwd(), '/main.scss');
						var sassVar = '$' + files.getBowerJson().name + '-is-silent: ' + silent + ';\n';

						var sassContent = fs.readFileSync(src, 'utf8');
						var tmpSrc = src.replace('.scss', '.tmp.scss');
						fs.writeFileSync(tmpSrc, sassVar + sassContent, 'utf8');

						sass(tmpSrc, {
								loadPath: ['.', 'bower_components'],
								style: 'compressed',
								sourcemap: false
							})
							.pipe(silentSass({silent: silent}))
							.on('error', function(err) {
								fs.unlink(tmpSrc);
								reject(err.message);
							})
							.on('end', function() {
								fs.unlink(tmpSrc);
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

module.exports = function(gulp, config) {
	runSilentModeTest(gulp)
		.then(function() {
			if (config.browserTest) {
				module.exports.browserTest(gulp, config);
			}
		}, function(error) {
			log.secondaryError(error);
			process.exit(1);
		});
	module.exports.npmTest();
};

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

module.exports.silentCompilation = function(gulp) {
	return silentCompilationTest(gulp, true);
};

module.exports.nonSilentCompilation = function(gulp) {
	return silentCompilationTest(gulp, false);
};

module.exports.npmTest = function() {
	var packageJson = files.getPackageJson();
	if (packageJson && packageJson.scripts && packageJson.scripts.test) {
		commandLine.run('npm', ['test'])
			.then(function(output) {
				log.primary('Running "npm test"...');
				log.secondary(output.stdout);
			}, function(output) {
				log.primary('Running "npm test"...');
				log.secondary(output.stdout);
				log.secondaryError(output.stderr);
				process.exit(1);
			});
	}
};

function pollHeroku(appUrl) {
	return new Promise(function(resolve, reject) {
			var timeout;
			var checker;
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
		var nightwatchCommand = path.resolve('.', 'node_modules/nightwatch/bin/nightwatch');

		var nightwatchConfigPath = config.nightwatchConfig || path.resolve('.', 'test/browser/nightwatch.json');
		var environments = config.environments || 'chrome37_Grid,chrome38_Grid,chrome39_Grid,chrome40_Grid,firefox30_Grid,firefox31_Grid,firefox32_Grid,firefox33_Grid,firefox34_Grid,firefox35_Grid,ie8_Grid,ie9_Grid,ie10_Grid,ie11_Grid,safari7_Grid';
		var testsPath = config.testsPath || 'test/browser/tests';
		fs.readFile(nightwatchConfigPath, function(err, configContent) {
			if (err) {
				reject(err);
			}

			configContent = JSON.parse(configContent);
			configContent.test_settings.default.launch_url = config.testUrl;

			fs.writeFile(nightwatchConfigPath, JSON.stringify(configContent), function(error) {
				if (error) {
					reject(error);
				}

				resolve(commandLine.run(nightwatchCommand, [
						'--group', testsPath,
						'--config', nightwatchConfigPath,
						'--env', environments
				]));
			});
		});
	});
};

module.exports.browserTest = function(gulp, config) {
	config = config || {};
	var appName = files.getModuleName();
	var token;
	var commit;
	haikro.logger.setLevel('debug');

	function cleanupTest() {
		fs.unlink('Procfile');
		return haikro.destroy({
			token: token,
			app: appName

			// Suppress any errors
			}).catch(function() {});
	}

	return Promise.all([
		process.env.HEROKU_AUTH_TOKEN ? Promise.resolve(process.env.HEROKU_AUTH_TOKEN) : commandLine.run('heroku', ['auth:token']),
		commandLine.run('git', ['rev-parse HEAD']),
		commandLine.run('npm', ['install', 'http-server']),
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
		if (e.stdout) {
			log.secondary(e.stdout);
			log.secondaryError(e.stderr);
		} else {
			log.secondaryError(e);
		}

		cleanupTest(e)
			.then(function() {
				process.exit(1);
			});
	});
};

module.exports.watchable = true;
module.exports.description = 'Test if Sass silent compilation follows the Origami specification';
