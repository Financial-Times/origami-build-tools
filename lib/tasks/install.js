'use strict';

var path = require('path');
var url = require('url');
var semver = require('semver');
var which = require('which');
var log = require('../helpers/log');
var commandLine = require('../helpers/command-line');
var files = require('../helpers/files');

var versions = {
	sass: '3.3.14',
	scssLint: '0.27.0',
	JSHint: '2.5.6',
	bower: '1.3.12'
};

function getInstalledSassGemVersion() {
	return getCommandVersion('sass', '--version');
}

function getInstalledScssLintGemVersion() {
	return getCommandVersion('scss-lint', '--version');
}

function getInstalledJshintVersion() {
	return getCommandVersion('jshint', '--version');
}

function getBowerCommand() {
	return new Promise(function(resolve, reject) {
		which('bower', function(err, bowerPath) {
			if (err || !bowerPath) {
				files.getNodeModulesDirectoryInUse()
					.then(function(modulespath) {
						var bowerCommand = path.join(modulespath, '/.bin/bower');
						resolve(bowerCommand);
					}, function(err) {
						reject(err);
					});
			} else {
				process.nextTick(function() { resolve(bowerPath); });
			}
		});
	});
}

function getInstalledBowerVersion() {
	// Check to see if bower is installed
	return getBowerCommand().then(function(bowerCommand) {
		return getCommandVersion(bowerCommand, '--version');
	}, function(error) {
		return new Promise(function(resolve, reject) {
			reject(error);
		});
	});
}

function getCommandVersion(command, versionFlag) {
	return new Promise(function(resolve, reject) {
		commandLine.run(command, [versionFlag, '2>&1'])
			.then(function(output) {
				var re = new RegExp(/\d+(\.\d+)+/);
				var version = output.stdout.trim().match(re);

				if (version) {
					resolve(version[0]);
				} else {
					// Craft an error message, although the command returned successfully,
					// parsing of the version failed.
					reject({
						stderr: 'Could not get version for command `' +
									command + ' ' + versionFlag +
									'`.  Running command output: ' +
									output.stderr + '\n' + output.stdout,
						stdout: ''
					});
				}
			}, function() {
				resolve(-1);
			});
	});
}

function cliSuccess(output) {
	if (output && output.stderr) {
		console.log(output.stderr);
	}
	if (output && output.stdout) {
		console.log(output.stdout);
	}
	log.primary('Install successful.');
}

function cliFailed(output) {
	log.primaryError('Task failed');
	log.primaryError(output.stderr);
}

module.exports = function(gulp, config) {
	module.exports.installSass();
	module.exports.installScssLint();
	module.exports.installBower()
		.then(function() {
			module.exports.runBowerInstall(config.verbose ? { verbose: true } : undefined);
		});
	module.exports.installJshint();

	var npmConfig = {};
	if (config && config.npmRegistry) {
		npmConfig.registry = config.npmRegistry;
	}
	if (config.verbose) {
		npmConfig.verbose = config.verbose;
	}
	module.exports.runNpmInstall(npmConfig);
};

module.exports.installSass = function() {
	function outputInstalling() {
		log.primary('Installing sass gem');
	}

	getInstalledSassGemVersion()
		.then(function(version) {
			if (version === -1 || semver.lt(version, versions.sass)) {
				commandLine.run('gem', ['install', 'sass', '-v', versions.sass])
					.then(function() {
						outputInstalling();
						cliSuccess();
					}, function(output) {
						outputInstalling();
						cliFailed(output);
						getCommandVersion('ruby', '--version')
							.then(function(version) {
								if (version === -1) {
									log.secondary('You need to install Ruby.  Please consult the Origami developer guide if you need help: http://origami.ft.com/docs/developer-guide/building-modules');
								}
							}, function(error) {
								log.secondaryError(error.stderr);
							});
					});
			} else {
				log.secondary('sass gem ' + version + ' already installed.');
			}
		}, function(error) {
			log.secondaryError(error);
		});
};

module.exports.installScssLint = function() {
	function outputInstalling() {
		log.primary('Installing scss-lint gem');
	}

	getInstalledScssLintGemVersion()
		.then(function(version) {
			if (version === -1 || semver.lt(version, versions.scssLint)) {
				commandLine.run('gem', ['install', 'scss-lint', '-v', versions.scssLint])
					.then(function() {
						outputInstalling();
						cliSuccess();
					}, function(output) {
						outputInstalling();
						cliFailed(output);
					});
			} else {
				log.secondary('scss-lint gem ' + version + ' already installed.');
			}
		}, function(error) {
			log.secondaryError(error);
		});
};

module.exports.installBower = function() {
	return new Promise(function(resolve, reject) {
		function outputInstalling() {
			log.primary('Installing Bower...');
		}

		getInstalledBowerVersion()
			.then(function(version) {
				if (version === -1 || semver.lt(version, versions.bower)) {
					commandLine.run('npm', ['install', '-g', 'bower', '--quiet'])
						.then(function() {
							outputInstalling();
							cliSuccess();
							resolve();
						}, function(output) {
							outputInstalling();
							cliFailed(output);
							reject();
						});
				} else {
					log.secondary('Bower ' + version + ' already installed');
					resolve();
				}
			}, function(error) {
				log.secondaryError(error);
				reject();
			});
	});
};

module.exports.installJshint = function() {
	function outputInstalling() {
		log.primary('Installing JSHint...');
	}

	getInstalledJshintVersion()
		.then(function(version) {
			if (version === -1 || semver.lt(version, versions.JSHint)) {
				commandLine.run('npm', ['install', '-g', 'jshint', '--quiet'])
					.then(function() {
						outputInstalling();
						cliSuccess();
					}, function(output) {
						outputInstalling();
						cliFailed(output);
					});
			} else {
				log.secondary('JSHint ' + version + ' already installed');
			}
		}, function(error) {
			log.secondaryError(error);
		});
};

module.exports.runNpmInstall = function(config) {
	function outputInstalling() {
		log.primary('npm install...');
	}
	var args = ['install'];
	if (config.registry) {
		args.push(['--registry '+config.registry]);
	}

	if (files.packageJsonExists()) {
		commandLine.run('npm', args, { stderr: 'pipe', stdout: 'pipe' })
			.then(function(output) {
				outputInstalling();
				cliSuccess(config.verbose ? output : undefined);
			}, function(output) {
				outputInstalling();
				cliFailed(output);
			});
	} else {
		log.secondary('no package.json, skipping npm install...');
	}
};

module.exports.runBowerInstall = function(config) {
	function outputInstalling(configContainsOrigamiRegistry) {
		log.primary('bower install...');
		if (!configContainsOrigamiRegistry) {
			log.primaryError('Origami registry is not configured in a .bowerrc file.  This is OK on automated environments such as Travis CI.');
			log.secondaryError('Ensure that a .bowerrc has been configured to contain http://registry.origami.ft.com as a search URL');
			log.secondaryError('For more information on configuring for the Origami registry see: http://origami.ft.com/docs/developer-guide/building-modules/#set-up-a-bower-package-manifest');
			log.secondaryError('For more information on bowerrc files see: http://bower.io/docs/config/');

			log.primaryError('Running with the default Origami registry settings..');
		}
	}

	if (files.bowerJsonExists()) {
		getBowerCommand()
			.then(function(command) {
				var bowerArgs = [
					'install'
				];

				// Try bower config
				var BowerConfig = require('bower-config');
				var loadedBowerConfig =  new BowerConfig(process.cwd()).load();

				// The registry key defaults to a string if the bowerrc is
				// not configured and an object with search key if it is
				// configured.  This coerces the search key into an array
				// in order to filter the search registry by host.
				var registrySearchConfig = Array.isArray(loadedBowerConfig._config.registry.search)  ?
														loadedBowerConfig._config.registry.search :
														[loadedBowerConfig._config.registry];

				var configContainsOrigamiRegistry = registrySearchConfig.filter(function(searchUrl) {
					return url.parse(searchUrl).host === 'registry.origami.ft.com';
				}).length > 0;

				if (!configContainsOrigamiRegistry) {
					// In order for automated environments such as travis
					// to work without a bowerrc file we configure bower
					// install to run with the origami registry configuration by default.
					bowerArgs = bowerArgs.concat([
						'--config.registry.search=http://registry.origami.ft.com',
						'--config.registry.search=https://bower.herokuapp.com'
					]);
				}

				commandLine.run(command, bowerArgs)
					.then(function(output) {
						outputInstalling(configContainsOrigamiRegistry);
						cliSuccess(config.verbose ? output : undefined);
					}, function(output) {
						outputInstalling(configContainsOrigamiRegistry);
						cliFailed(output);
					});
			});
	} else {
		log.secondary('no bower.json, skip bower install...');
	}
};

module.exports.watchable = false;
module.exports.description = 'Install system and local dependencies (add --verbose to show output from npm and bower install)';
