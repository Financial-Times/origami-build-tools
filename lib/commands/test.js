/*global require, process */

"use strict";

var async = require('async'),
    log = require('../log.js'),
    files = require('../files.js'),
    sass = require('../sass.js'),
    fs = require('fs');

exports.sassSilence = function() {

    if (files.sassExists()) {

        files.createTempFolder();

        var src = process.cwd() + '/main.scss';

        async.series([
            function(callback) {
                var dest = files.getTempFolderPath() + '/silent.css';
                sass.compile(src, dest, function() {
                    if (fs.existsSync(dest) && fs.statSync(dest).size === 0) {
                        log.primary("SASS compiled and correctly silent.");
                        callback(null, 0);
                    } else {
                        log.primaryError("SASS not compiled.");
                        callback(null, 1);
                    }
                });
            },
            function(callback) {
                var dest = files.getTempFolderPath() + '/non-silent.css';
                sass.compileWithVars(src, dest, {
                    "o-dummy-is-silent": false
                }, function() {
                    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
                        log.primary("SASS compiled and correctly non-silent.");
                        callback(null, 0);
                    } else {
                        log.primaryError("SASS not compiled.");
                        callback(null, 1);
                    }
                });
            }
        ], function(error, results) {
            if (results.indexOf(1) === -1) {
                log.primary("Tests done.");
                files.deleteTempFolder();
            } else {
                log.primaryError("Tests failed.");
            }
        });

    }
};