/*global require, exports, process */

"use strict";

var fs = require('fs'),
    async = require('async'),
    builder = require('./build'),
    files = require('../files.js'),
    verify = require('../verify.js'),
    sass = require('../sass.js'),
    log = require('../log.js'),
    bowerJson;

function testSilentCompile(callback) {
    var mainCss = files.getBuildFolderPath() + '/main.css';
    if (fs.existsSync(mainCss) && fs.statSync(mainCss).size === 0) {
        log.primary("SASS correctly silent.");
        callback(null, 0);
    } else {
        log.primaryError("SASS not compiled.");
        callback(null, 1);
    }
}

function testNonSilentCompile(callback) {
    var nonSilentCss = files.getBuildFolderPath() + '/non-silent.css',
        sassVars = {};
    sassVars[bowerJson.name + '-is-silent'] = false;
    sass.compileWithVars(process.cwd() + '/main.scss', nonSilentCss, sassVars, function() {
        if (fs.existsSync(nonSilentCss) && fs.statSync(nonSilentCss).size > 0) {
            log.primary("Non-silent SASS compiled and correctly non-silent.");
            callback(null, 0);
        } else {
            log.primaryError("SASS not compiled.");
            callback(null, 1);
        }
    });
}

exports.run = function(callback) {

    bowerJson = files.getBowerJson();
    if (!bowerJson) {
        return;
    }
    if (typeof callback !== "function") {
        callback = function() {};
    }

    builder.run(function(err) {
        if (err) {
            log.primaryError("Tests failed.");
            callback(err);
        } else if (verify.mainSass()) {
            files.sassSupportsSilent(function(supportsSilent) {
                if (supportsSilent) {
                    async.series([
                        testSilentCompile,
                        testNonSilentCompile
                    ], function(error, results) {
                        if (results.indexOf(1) === -1) {
                            log.primary("Tests passed.");
                            callback();
                        } else {
                            log.primaryError("Tests failed.");
                            callback({});
                        }
                    });
                }
            });
        }

    });

};