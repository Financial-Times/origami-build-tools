/*global require, process */

"use strict";

var fs = require('fs'),
    browserify = require('browserify'),
    files = require('../files.js'),
    log = require('../log.js');

function runBrowserify(name, src, callback) {
    var b = browserify();
    b.require(src, { expose: name });
    b.transform({}, 'debowerify');
    b.transform({}, 'brfs');
    b.bundle({
    }, callback);
}

function testBrowserify(callback) {
    var name = files.getBowerJson().name,
        src = process.cwd() + '/main.js';
    runBrowserify(name, src, function(error, result) {
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
                log.primaryError("JS failed to Browserify.", error);
            } else {
                log.primary("JS successfully Browserified.");
            }
        });

    }

};