/*global require, exports, process */

var async = require('async'),
    files = require('../files'),
    verify = require('../verify'),
    sass = require('../sass'),
    script = require('../script'),
    log = require('../log');

exports.run = function(callback) {
    "use strict";

    var bowerJson = files.getBowerJson(),
        buildItems = [];
    if (!bowerJson || !bowerJson.main) {
        return;
    }

    files.createBuildFolder();

    if (verify.mainSass()) {
        buildItems.push(function(callback) {
            var src = process.cwd() + '/main.scss',
                dest = files.getBuildFolderPath() + '/main.css';
            log.secondary("Compiling " + src);
            sass.compile(src, dest, function(error) {
                if (error) {
                    callback(error, 1);
                } else {
                    log.secondary("Created " + dest);
                    callback(null, 0);
                }
            });
        });
    }

    if (verify.mainJs()) {
        buildItems.push(function(callback) {
            var src = process.cwd() + '/main.js',
                dest = files.getBuildFolderPath() + '/main.js';
            log.secondary("Browserifying " + src);
            script.runBrowserify(bowerJson.name, src, dest, function(error) {
                if (error) {
                    callback(error, 1);
                } else {
                    log.secondary("Created " + dest);
                    callback(null, 0);
                }
            });
        });
    }

    async.parallel(buildItems, function(error) {
        if (error) {
            log.primaryError('Build failed. ' + error);
            if (callback) {
                callback(error);
            } else {
                process.exit(1);
            }
        } else {
            log.primary('Build complete');
            if (callback) {
                callback(null);
            } else {
                process.exit(0);
            }
        }
    });

}