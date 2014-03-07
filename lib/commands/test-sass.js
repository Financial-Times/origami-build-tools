/*global require, process, exports */

"use strict";

var async = require('async'),
    log = require('../log.js'),
    files = require('../files.js'),
    sass = require('../sass.js'),
    fs = require('fs'),
    src;

function testSassCompile(callback) {
    var dest = files.getTempFolderPath() + '/main.css';
    sass.compile(src, dest, function() {
        if (fs.existsSync(dest)) {
            log.primary("SASS compiled.");
            callback(null, 0);
        } else {
            log.primaryError("SASS not compiled.");
            callback(null, 1);
        }
    });
}

function testSilentCompile(callback) {
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
}

function testNonSilentCompile(callback) {
    var bowerJson = files.getBowerJson();
    if (!bowerJson || !bowerJson.name) {
        callback(null, 0);
    }
    var dest = files.getTempFolderPath() + '/non-silent.css',
        sassVars = {};
    sassVars[bowerJson.name + '-is-silent'] = false;
    sass.compileWithVars(src, dest, sassVars, function() {
        if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
            log.primary("SASS compiled and correctly non-silent.");
            callback(null, 0);
        } else {
            log.primaryError("SASS not compiled.");
            callback(null, 1);
        }
    });
}

exports.run = function() {

    if (files.sassExists()) {
        files.createTempFolder();
        src = process.cwd() + '/main.scss';
        var tests = [testSassCompile];

        files.sassSupportsSilent(function(supportsSilent) {
            if (supportsSilent) {
                tests.push(testSilentCompile);
                tests.push(testNonSilentCompile);
            }
            async.series(tests, function(error, results) {
                if (results.indexOf(1) === -1) {
                    log.primary("Tests done.");
                    files.deleteTempFolder();
                } else {
                    log.primaryError("Tests failed.");
                }
            });
        });

    }
};