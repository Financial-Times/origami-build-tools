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
    childProcess = require("child_process");


function getInstalledSassGemVersion(callback) {
    "use strict";
    getCommandVersion('sass', '--version', callback);
}

function getInstalledScssLintGemVersion(callback) {
    "use strict";
    getCommandVersion('scss-lint', '--version', callback);
}

function getInstalledBowerVersion(callback) {
    "use strict";
    getCommandVersion(path.join(process.cwd(), '/node_modules/bower/bin/bower'), '--version', callback);
}

function getCommandVersion(command, versionFlag, callback) {
    "use strict";
    commandLine.run(command, [versionFlag], function(error, output) {
        if (!error) {
            var re = new RegExp(/\d+(\.\d+)+/),
                version = output.stdout.toString().trim().match(re);

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
            var jsHint = path.join(process.cwd(), '/node_modules/.bin/jshint');

            getCommandVersion(jsHint, '--version', function(version) {
                if (version === -1 || semver.lt(version, requiredJsHintVersion)) {
                    log.primary("Install JSHint...");
                    commandLine.run('npm', ['install', 'jshint'], callback);
                } else {
                    log.secondary("JSHint" + version + " already installed");
                    callback();
                }
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
                var bowerCommand = path.join(process.cwd(), '/node_modules/bower/bin/bower'),
                    bowerArgs = [
                        'install',
                        '--config.registry.search=http://registry.origami.ft.com',
                        '--config.registry.search=https://bower.herokuapp.com'
                    ];

                commandLine.run(bowerCommand, bowerArgs, { stderr: 'pipe', stdout: 'pipe' }, callback);
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
            log.primaryError(err);
        } else {
            log.primary("Install successful.");
        }
    });
};
