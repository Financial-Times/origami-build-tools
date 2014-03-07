/*global require, process, exports */

"use strict";

var files = require('../files.js'),
    script = require('../script.js'),
    log = require('../log.js');

function testBrowserify(callback) {
    var src = process.cwd() + '/main.js';
    script.runBrowserify(files.getModuleName(), src, "", function(error) {
        if (error) {
            log.secondaryError("Browserify of main.js failed.");
            callback(null, 1);
        } else {
            log.secondary("Browserify of main.js successful.");
            callback(null, 0);
        }
    });
}

exports.run = function() {

    if (files.jsExists()) {

        testBrowserify(function(error) {
            if (error) {
                log.primaryError("JS failed to Browserify.");
            } else {
                log.primary("JS successfully Browserified.");
            }
        });

    }

};