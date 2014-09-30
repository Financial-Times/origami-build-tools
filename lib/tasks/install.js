/*global require, exports, process */

'use strict';

var path = require('path'),
	url = require('url'),
	childProcess = require("child_process"),
    async = require('async'),
    semver = require('semver'),
    which = require('which'),
    log = require('../helpers/log'),
    commandLine = require('../helpers/command-line'),
    files = require('../helpers/files');

var versions = {
	sass: '3.4.5',
	scssLint: '0.25.1',
	JSHint: '2.5.1',
	bower: '1.3.1' 
}

function getInstalledSassGemVersion(callback) {
    getCommandVersion('sass', '--version', callback);
}

function getInstalledScssLintGemVersion(callback) {
    getCommandVersion('scss-lint', '--version', callback);
}

function getBowerCommand(callback) {
	which("bower", function(err, bowerPath) {

		if (err || !bowerPath) {
			files.getNodeModulesDirectoryInUse(function(err, modulespath) {
				if (err) {
					callback(err);
				}

				bowerCommand = path.join(modulespath, '/.bin/bower');
				callback(err, bowerCommand);
			});
			return;
		}

		process.nextTick(function() {  callback(null, bowerPath); });
	});
}

function getInstalledBowerVersion(callback) {
	// Check to see if bower is installed
	getBowerCommand(function(err, bowerCommand) {
		getCommandVersion(bowerCommand, '--version', callback);
	});
}

function getCommandVersion(command, versionFlag, callback) {
    commandLine.run(command, [versionFlag, '2>&1'], function(error, output) {
		if (error) {
			callback(error);
			return;
		}

		var re = new RegExp(/\d+(\.\d+)+/),
			version = output.stdout.trim().match(re);

		if (version) {
			callback(null, version[0]);
		} else {
			// Craft an error message, although the command returned successfully,
			// parsing of the version failed.
			callback({
				stderr: "Could not get version for command `" +
							command + " " + versionFlag +
							"`.  Running command output: " +
							output.stderr + "\n" + output.stdout,
				stdout: ''
			});
		}
	});
}

function commandlineCallback(err) {
	if (err) {
		log.primaryError("Task failed");
		log.primaryError(err.stderr);
	} else {
        log.primary("Install successful.");
    }
}

module.exports = function() {
	module.exports.installSass();
	module.exports.installScssLint();
	module.exports.installBower();
	module.exports.installJshint();
	module.exports.runNpmInstall();
	module.exports.runBowerInstall();
};

module.exports.installSass = function() {
    getInstalledSassGemVersion(function(error, version) {
        if (error || version === -1 || semver.lt(version, versions.sass)) {
			log.primary("Install sass gem");
			commandLine.run('gem', ['install', 'sass', '-v', versions.sass], commandlineCallback);
			return;
        } else {
            log.secondary("sass gem " + version + " already installed.");
        }
    });
},
module.exports.installScssLint = function() {
    getInstalledScssLintGemVersion(function(error, version) {
        if (error || version === -1 || semver.lt(version, versions.scssLint)) {
			log.primary("Install scss-lint gem");
			commandLine.run('gem', ['install', 'scss-lint', '-v', versions.scssLint], commandlineCallback);
			return;
        } else {
            log.secondary("scss-lint gem " + version + " already installed.");
        }
    });
}

module.exports.installBower = function() {
    getInstalledBowerVersion(function(error, version) {
        if (error || version === -1 || semver.lt(version, versions.bower)) {
            log.primary("Install Bower...");
            commandLine.run('npm', ['install', 'bower', '--quiet'], { stderr: 'pipe', stdout: 'pipe' }, commandlineCallback);
        } else {
            log.secondary("Bower " + version + " already installed");
        }
    });
},
module.exports.installJshint = function() {
	files.getNodeModulesDirectoryInUse(function(err, nodeModulesPath) {
		var jsHint = path.join(nodeModulesPath, "/.bin/jshint");

		getCommandVersion(jsHint, '--version', function(error, version) {
			if (error || version === -1 || semver.lt(version, versions.JSHint)) {
				log.primary("Install JSHint...");
				commandLine.run('npm', ['install', 'jshint'], commandlineCallback);
				return;
			} else {
				log.secondary("JSHint" + version + " already installed");
			}
		});
	});
},
module.exports.runNpmInstall = function() {
    if (files.packageJsonExists()) {
        log.primary("npm install...");
        commandLine.run('npm', ['install'], { stderr: 'pipe', stdout: 'pipe' }, commandlineCallback);
    } else {
        log.secondary("no package.json, skipping npm install...");
    }
},
module.exports.runBowerInstall = function() {
    if (files.bowerJsonExists()) {
        log.primary("bower install...");
        var bowerCommand = getBowerCommand(function(err, command) {
			var bowerArgs = [
				'install'
			];

			// Try bower config
			var BowerConfig = require("bower-config");
			var loadedBowerConfig =  new BowerConfig(process.cwd()).load();

			// The registry key defaults to a string if the bowerrc is
			// not configured and an object with search key if it is
			// configured.  This coerces the search key into an array
			// in order to filter the search registry by host.
			var registrySearchConfig = Array.isArray(loadedBowerConfig._config.registry.search)  ?
										loadedBowerConfig._config.registry.search : 
										[loadedBowerConfig._config.registry];

			var configContainsOrigamiRegistry = registrySearchConfig.filter(function(searchUrl) {
				return url.parse(searchUrl).host === 'registry.origami.ft.com'
			}).length > 0;

			if (!configContainsOrigamiRegistry) {
				log.primaryError("Origami registry is not configured in a .bowerrc file.  This is OK on automated environments such as Travis CI.");
				log.secondaryError("Ensure that a .bowerrc has been configured to contain http://registry.origami.ft.com as a search URL");
				log.secondaryError("For more information on configuring for the Origami registry see: http://origami.ft.com/docs/developer-guide/building-modules/#set-up-a-bower-package-manifest");
				log.secondaryError("For more information on bowerrc files see: http://bower.io/docs/config/");

				log.primaryError("Running with the default Origami registry settings..");

				// In order for automated environments such as travis
				// to work without a bowerrc file we configure bower
				// install to run with the origami registry configuration by default.
				bowerArgs = bowerArgs.concat([
					'--config.registry.search=http://registry.origami.ft.com',
					'--config.registry.search=https://bower.herokuapp.com'
				]);
			}

			commandLine.run(command, bowerArgs, commandlineCallback);
		});
	} else {
		log.secondary("no bower.json, skip bower install...");
	}
}

module.exports.watachable = false;
module.exports.description = 'Installs Origami module and any additional required development tools';
