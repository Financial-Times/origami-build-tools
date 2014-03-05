/*global require */

"use strict";

var async = require('async'),
    childProcess = require('child_process'),
    log = require('../log.js'),
    files = require('../files.js');

function spawnProcess(command, args, callback) {
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
    async.series([
        function(callback) {
            if (files.sassExists()) {
                log.primary("Install SASS gem...");
                spawnProcess('gem', ['install', 'sass'], callback);
            } else {
                log.secondary("no main.scss, skip SASS gem install...");
                callback();
            }
        },
        function(callback) {
            log.primary("Install Bower");
            spawnProcess('npm', ['install', '-g', 'bower'], callback);
        },
        function(callback) {
            log.primary("Install Grunt CLI");
            spawnProcess('npm', ['install', '-g', 'grunt-cli'], callback);
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
                spawnProcess('bower', ['install'], callback);
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