/*global require, exports */


var async = require('async'),
    childProcess = require('child_process'),
    log = require('../log.js'),
    verify = require('../verify.js'),
    files = require('../files.js'),
    sass = require('../sass.js');

function spawnProcess(command, args, callback) {
    "use strict";
    var pro = childProcess.spawn(command, args);
    pro.stdout.on('data', function(data) {
        log.secondary(data);
    });
    pro.stderr.on('data', function(data) {
        log.secondaryError(data);
    });
    pro.on('close', function(code) {
        callback(null, command + ':' + code);
    });
    return pro;
}

exports.run = function() {
    "use strict";
    async.series([
        function(callback) {
            if (verify.mainSass()) {
                sass.gemInstallRequired(function(req) {
                    if (req) {
                        log.primary("Install sass gem");
                        spawnProcess('gem', ['install', 'sass', '-v', sass.requiredSassGemVersion], callback);
                    } else {
                        callback();
                    }
                });
            } else {
                callback();
            }
        },
        function(callback) {
            log.primary("Install Bower...");
            spawnProcess('npm', ['install', '-g', 'bower'], callback);
        },
        function(callback) {
            if (files.packageJsonExists()) {
                log.primary("npm install...");
                spawnProcess('npm', ['install'], callback);
            } else {
                log.secondary("no package.json, skip npm install...");
                callback();
            }
        },
        function(callback) {
            if (files.bowerJsonExists()) {
                log.primary("bower install...");
                spawnProcess('bower', ['install', '--config.registry.search=http://registry.origami.ft.com', '--config.registry.search=https://bower.herokuapp.com'], callback);
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