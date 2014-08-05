/*global require, exports, process */

var path = require('path'),
    async = require('async'),
    semver = require('semver'),
    log = require('../log'),
    commandLine = require('../command-line'),
    verify = require('../verify'),
    files = require('../files'),
    requiredSassGemVersion = "3.3.7",
    requiredScssLintGemVersion = "0.25.1",
    requiredBowerVersion = "1.3.1",
    requiredJsHintVersion = "2.5.1",
    childProcess = require("child_process"),
    which = require('which'),
    path = require('path'),
	url = require('url');


function getInstalledSassGemVersion(callback) {
    "use strict";
    getCommandVersion('sass', '--version', callback);
}

function getInstalledScssLintGemVersion(callback) {
    "use strict";
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
    "use strict";
	// Check to see if bower is installed
	getBowerCommand(function(err, bowerCommand) {
		getCommandVersion(bowerCommand, '--version', callback);
	});
}

function getCommandVersion(command, versionFlag, callback) {
    "use strict";

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

exports.run = function() {
    "use strict";

    var sassTasks,
        generalTasks,
        runTasks;

    sassTasks = [
        function(callback) {
            if (verify.mainSass()) {
                getInstalledSassGemVersion(function(error, version) {
                    if (error || version === -1 || semver.lt(version, requiredSassGemVersion)) {
						log.primary("Install sass gem");
						commandLine.run('gem', ['install', 'sass', '-v', requiredSassGemVersion], callback);
						return;
                    } else {
                        log.secondary("sass gem " + version + " already installed.");
                        process.nextTick(function() { callback(); });
                    }
                });
            } else {
                process.nextTick(function() { callback(); });
            }
        },
        function(callback) {
            getInstalledScssLintGemVersion(function(error, version) {
                if (error || version === -1 || semver.lt(version, requiredScssLintGemVersion)) {
					log.primary("Install scss-lint gem");
					commandLine.run('gem', ['install', 'scss-lint', '-v', requiredScssLintGemVersion], callback);
					return;
                } else {
                    log.secondary("scss-lint gem " + version + " already installed.");
                    process.nextTick(function() { callback(); });
                }
            });
        }
    ];

    generalTasks = [
        function(callback) {
            getInstalledBowerVersion(function(error, version) {
                if (error || version === -1 || semver.lt(version, requiredBowerVersion)) {
                    log.primary("Install Bower...");
                    commandLine.run('npm', ['install', 'bower', '--quiet'], { stderr: 'pipe', stdout: 'pipe' }, callback);
                } else {
                    log.secondary("Bower " + version + " already installed");
                    process.nextTick(function() { callback(); });
                }
            });
        },
        function(callback) {
			files.getNodeModulesDirectoryInUse(function(err, nodeModulesPath) {
				var jsHint = path.join(nodeModulesPath, "/.bin/jshint");

				getCommandVersion(jsHint, '--version', function(error, version) {
					if (error || version === -1 || semver.lt(version, requiredJsHintVersion)) {
						log.primary("Install JSHint...");
						commandLine.run('npm', ['install', 'jshint'], callback);
						return;
					} else {
						log.secondary("JSHint" + version + " already installed");
						callback();
					}
				});
			});
        },
        function(callback) {
            if (files.packageJsonExists()) {
                log.primary("npm install...");
                commandLine.run('npm', ['install'], { stderr: 'pipe', stdout: 'pipe' }, callback);
            } else {
                log.secondary("no package.json, skipping npm install...");
                callback();
            }
        },
        function(callback) {
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
												loadedBowerConfig._config.registry.search : [loadedBowerConfig._config.registry];

					var configContainsOrigamiRegistry = registrySearchConfig.filter(function(searchUrl) {
						return url.parse(searchUrl).host === 'registry.origami.ft.com'
					}).length > 0;

					if (!configContainsOrigamiRegistry) {
						log.primaryError("Origami registry is not configured in a .bowerrc file.");
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

					commandLine.run(command, bowerArgs, callback);
				});
			} else {
				log.secondary("no bower.json, skip bower install...");
				callback();
			}
        }
    ];

    if (verify.mainSass()) {
        runTasks = sassTasks.concat(generalTasks);
    } else {
        runTasks = generalTasks;
    }

    async.series(runTasks, function(err) {
		if (err) {
			log.primaryError("Task failed");
			log.primaryError(err.stderr);
		} else {
            log.primary("Install successful.");
        }
    });
};
