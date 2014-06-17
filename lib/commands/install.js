/*global require, exports, process */

var path = require('path'),
    async = require('async'),
    semver = require('semver'),
    log = require('../log'),
    commandLine = require('../command-line'),
    verify = require('../verify'),
    files = require('../files'),
    requiredSassGemVersion = "3.3.3",
    requiredBowerVersion = "1.3.1";

function getInstalledSassGemVersion(callback) {
    "use strict";
    commandLine.run('sass', ['--version'], function(error, output) {
        if (error) {
            callback(-1);
        } else {
            var re = new RegExp(/\d+(\.\d+)+/),
                version = output.stdout.trim().match(re);
            if (version) {
                callback(version[0]);
            } else {
                callback(-1);
            }
        }
    });
}

function getInstalledBowerVersion(callback) {
    "use strict";
    commandLine.run(path.join(process.cwd(), '/node_modules/bower/bin/bower'), ['--version'], function(err, result) {
        if (!err) {
            callback(result.stdout.trim() || -1);
        } else {
            callback(-1);
        }
    });
}


exports.run = function() {
    "use strict";

    async.series([
        function(callback) {
            if (verify.mainSass()) {
                getInstalledSassGemVersion(function(version) {
                    if (version === -1 || semver.lt(version, requiredSassGemVersion)) {
                        log.primary("Install sass gem");
                        commandLine.run('gem', ['install', 'sass', '-v', requiredSassGemVersion], callback, { stderr: 'pipe', stdout: 'pipe' });
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
            getInstalledBowerVersion(function(version) {
                if (version === -1 || semver.lt(version, requiredBowerVersion)) {
                    log.primary("Install Bower...");
                    commandLine.run('npm', ['install', 'bower', '--quiet'], callback, { stderr: 'pipe', stdout: 'pipe' });
                } else {
                    log.secondary("Bower " + version + " already installed");
                    callback();
                }
            });
        },
        function(callback) {
            if (files.packageJsonExists()) {
                log.primary("npm install...");
                commandLine.run('npm', ['install'], callback, { stderr: 'pipe', stdout: 'pipe' });
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

                commandLine.run(bowerCommand, bowerArgs, callback, { stderr: 'pipe', stdout: 'pipe' });
            } else {
                log.secondary("no bower.json, skip bower install...");
                callback();
            }
        }
    ], function(err) {
        if (err) {
            log.primaryError(err);
        } else {
            log.primary("Install successful.");
        }
    });
};
