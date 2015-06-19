'use strict';

var path = require('path');
var url = require('url');
var semver = require('semver');
var which = require('which');
var log = require('../helpers/log');
var commandLine = require('../helpers/command-line');
var files = require('../helpers/files');

// As gem doesn't understand semvers we list the latest known versions here
// This means install will pick up these versions if none already installed
// but will not force users who are on a version compatible with the semver
// to install patches
var bestGems = {
	scssLint: '0.35.0'
};

var versions = {
	scssLint: '>=0.27.0 <='+bestGems.scssLint,
	bower: '^1.3.0'
};

function getInstalledScssLintGemVersion() {
	return getCommandVersion('scss-lint', '--version');
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

function cliFailed(output, command) {
	var errors = [];
	errors.push('Task failed');
	if (output.stderr.indexOf('EACCESS') > -1) {
		errors.push('On some systems, OBT\'s dependencies require sudo to install.  Please run the following command and then retry your install');
		errors.push('sudo ' + command);
		errors.push('It’s recommended that you configure your system so that npm modules can be globally installed without requiring root');
	} else {
		errors.push(output.stderr);
	}
	return errors;
}

module.exports = function(gulp, config) {
	return new Promise(function(resolve, reject) {
		var npmConfig = {};
		if (config) {
			if (config.npmRegistry) {
				npmConfig.registry = config.npmRegistry;
			}
			if (config.verbose) {
				npmConfig.verbose = config.verbose;
			}
		}

		Promise.all([
			module.exports.installScssLint(),
			module.exports.installBower()
				.then(function() {
					return module.exports.runBowerInstall(config && config.verbose ? { verbose: true } : {});
				}),
			module.exports.runNpmInstall(npmConfig)
		])
		.catch(function(error) {
			reject(error);
		});
	});
};

module.exports.installScssLint = function() {
	function outputInstalling() {
		log.primary('Installing scss-lint gem');
	}

	return new Promise(function(resolve, reject) {
		getInstalledScssLintGemVersion()
			.then(function(version) {
				if (version === -1 || !semver.satisfies(version, versions.scssLint)) {
					commandLine.run('gem', ['install', 'scss-lint', '-v', bestGems.scssLint])
						.then(function() {
							outputInstalling();
							cliSuccess();
							resolve();
						}, function(output) {
							outputInstalling();
							reject(cliFailed(output, 'gem install scss-lint -v ' + bestGems.scssLint));
						});
				} else {
					log.secondary('scss-lint gem ' + version + ' already installed.');
					resolve();
				}
			}, function(error) {
				reject(error);
			});
	});
};

module.exports.installBower = function() {
	function outputInstalling() {
		log.primary('Installing Bower...');
	}

	return new Promise(function(resolve, reject) {
		getInstalledBowerVersion()
			.then(function(version) {
				if (version === -1 || !semver.satisfies(version, versions.bower)) {
					commandLine.run('npm', ['install', '-g', 'bower@' + versions.bower, '--quiet'])
						.then(function() {
							outputInstalling();
							cliSuccess();
							resolve();
						}, function(output) {
							outputInstalling();
							reject(cliFailed(output, 'npm install -g bower@' + versions.bower));
						});
				} else {
					log.secondary('Bower ' + version + ' already installed');
					resolve();
				}
			}, function(error) {
				reject(error);
			});
	});
};

module.exports.runNpmInstall = function(config) {
	function outputInstalling() {
		log.primary('npm install...');
	}

	return new Promise(function(resolve, reject) {
		var args = ['install'];
		if (config.registry) {
			args.push(['--registry '+config.registry]);
		}

		//	if (config.verbose) {
		//		args.push(['--loglevel info']);
		//	}

		if (files.packageJsonExists()) {
			commandLine.run('npm', args, { stderr: 'pipe', stdout: 'pipe' })
				.then(function(output) {
					outputInstalling();
					cliSuccess(config.verbose ? output : undefined);
					resolve();
				}, function(output) {
					outputInstalling();
					reject(cliFailed(output));
				});
		} else {
			log.secondary('no package.json, skipping npm install...');
			resolve();
		}
	});
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

	return new Promise(function(resolve, reject) {
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
							resolve();
						}, function(output) {
							outputInstalling(configContainsOrigamiRegistry);
							cliFailed(output);
							reject();
						});
				});
		} else {
			log.secondary('no bower.json, skip bower install...');
			resolve();
		}
	});
};

module.exports.watchable = false;
module.exports.description = 'Install system and local dependencies (add --verbose to show output from npm and bower install)';
