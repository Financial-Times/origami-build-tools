/*global require, exports, process */

var path = require('path'),
    async = require('async'),
    semver = require('semver'),
    log = require('../log'),
    commandLine = require('../command-line'),
    verify = require('../verify'),
    files = require('../files'),
    requiredSassGemVersion = "3.3.3",
    requiredScssLintGemVersion = "0.24.1",
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

/** Get the node_modules directory that will be used when `npm install` is run
 *  in the current working directory (process.cwd()). This is necessary as npm walks up the
 *  directory tree until it finds a node_modules directory when npm installing.
 */
function getNodeModulesDirectoryInUse(callback) {
	var npmconf = require('npmconf');

	npmconf.load({}, function(err, conf) {
		if (err) {
			process.nextTick(function() { callback(err) });
			return;
		}

		conf.findPrefix(process.cwd(), function(err, pathPrefix) {
			var nodeModulesPath = pathPrefix;

			if (pathPrefix) {
				nodeModulesPath = path.join(pathPrefix, "node_modules");
			}

			process.nextTick(function() { callback(err, nodeModulesPath); });
		});
	});
}

function getBowerCommand(callback) {
	which("bower", function(err, bowerPath) {

		if (err || !bowerPath) {
			getNodeModulesDirectoryInUse(function(err, modulespath) {
				if (err) {
					process.nextTick(function() { callback(err); });
				}

				bowerCommand = path.join(modulespath, '/.bin/bower');
				process.nextTick(function() { callback(err, bowerCommand); });
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
        if (!error) {
            var re = new RegExp(/\d+(\.\d+)+/),
                version = output.stdout.trim().match(re);

            if (version) {
                callback(version[0]);
                return;
            }
        }

        callback(-1);
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
                getInstalledSassGemVersion(function(version) {
                    if (version === -1 || semver.lt(version, requiredSassGemVersion)) {
                        log.primary("Install sass gem");
                        commandLine.run('gem', ['install', 'sass', '-v', requiredSassGemVersion], { stderr: 'pipe', stdout: 'pipe' }, callback);
                    } else {
                        log.secondary("sass gem " + version + " already installed.");
                        callback();
                    }
                });
            } else {
                callback();
            }
        },
        function(callback) {
            getInstalledScssLintGemVersion(function(version) {
                if (version === -1 || semver.lt(version, requiredScssLintGemVersion)) {
                    log.primary("Install scss-lint gem");
                    commandLine.run('gem', ['install', 'scss-lint', '-v', requiredScssLintGemVersion], callback);
                } else {
                    log.secondary("scss-lint gem " + version + " already installed.");
                    callback();
                }
            });
        }
    ];

    generalTasks = [
        function(callback) {
            getInstalledBowerVersion(function(version) {
                if (version === -1 || semver.lt(version, requiredBowerVersion)) {
                    log.primary("Install Bower...");
                    commandLine.run('npm', ['install', 'bower', '--quiet'], { stderr: 'pipe', stdout: 'pipe' }, callback);
                } else {
                    log.secondary("Bower " + version + " already installed");
                    callback();
                }
            });
        },
        function(callback) {
			getNodeModulesDirectoryInUse(function(err, nodeModulesPath) {
				var jsHint = path.join(nodeModulesPath, "/.bin/jshint");

				getCommandVersion(jsHint, '--version', function(version) {
					if (version === -1 || semver.lt(version, requiredJsHintVersion)) {
						log.primary("Install JSHint...");
						commandLine.run('npm', ['install', 'jshint'], callback);
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
                log.secondary("no package.json, skip npm install...");
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

					// The registry key defaults to a string if not
					// configured. Or an object with search key if not.  This
					// coerces into an array to filter by host.
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
						// install to run with the configuration added.
						bowerArgs.concat([
							'--config.registry.search=http://registry.origami.ft.com',
							'--config.registry.search=https://bower.herokuapp.com'
						]);
					}

					commandLine.run(command, bowerArgs, { stderr: 'pipe', stdout: 'pipe' }, callback);
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
		if (err === 'EBUILDFAILED') {
			log.primaryError('Install unsuccessful.');
		} else if (err) {
			log.primaryError(err);
		} else {
            log.primary("Install successful.");
        }
    });
};
