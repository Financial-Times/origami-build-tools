'use strict';

var async = require('async'),
    fs = require('fs'),
    files = require('../files'),
    verify = require('../verify'),
    sass = require('../sass'),
    script = require('../script'),
    log = require('../log');

exports.run = function(callback) {
    var bowerJson = files.getBowerJson(),
        buildItems = [];
    if (!bowerJson || !bowerJson.main) {
        return;
    }
    if (typeof callback !== "function") {
        callback = function() {};
    }

    files.createBuildFolder();

    if (verify.mainSass()) {
        buildItems.push(function(taskCallback) {
            var src = process.cwd() + '/main.scss',
                dest = files.getBuildFolderPath() + '/main.css';
            var sassFile = fs.readFileSync(src, 'utf8');
            log.secondary("Compiling " + src);
            sass.compile(sassFile, dest, { style: 'compressed', loadPaths: ['.'] }, function(error) {
                if (error) {
                    taskCallback(error, 1);
                } else {
                    log.secondary("Created " + dest);
                    taskCallback(null, 0);
                }
            });
        });
    }

    if (verify.mainJs()) {
        buildItems.push(function(taskCallback) {
            var src = process.cwd() + '/main.js',
                dest = files.getBuildFolderPath() + '/main.js';
            log.secondary("Browserifying " + src);
            script.runBrowserify(bowerJson.name, src, dest, function(error) {
                if (error) {
                    taskCallback(error, 1);
                } else {
                    log.secondary("Created " + dest);
                    taskCallback(null, 0);
                }
            });
        });
    }

    async.parallel(buildItems, function(error) {
        if (error) {
            log.primaryError('Build failed.');
            callback(error);
        } else {
            log.primary('Build complete');
            callback();
        }
    });

};
