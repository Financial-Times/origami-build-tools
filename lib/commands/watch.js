/*global require, exports, process */

"use strict";

var path = require('path'),
    gaze = require('gaze'),
    builder = require('./build'),
    log = require('../log'),
    watchGlobs = [
        // include
        '**/*.js',
        '**/*.scss',
        '**/*.mustache',
        '**/*.json',
        // exclude
        '!build/**',
        '!node_modules/**',
        '!bower_components/**',
        '!demos/*',
        '!origami.json',
        '!bower.json',
        '!package.json',
        '!**/tmp-src.scss'
    ];

exports.run = function(task) {

    if (typeof task !== "function") {
        return;
    }

    var watcher = new gaze.Gaze(watchGlobs),
        suspendTask;

    function onReady() {
        suspendTask = false;
        log.primary('watching...');
    }

    watcher.on('ready', onReady);

    watcher.on('all', function(event, filepath) {
        var file = path.relative(process.cwd(), filepath);
        log.primary(file + ' ' + event);
        if (!suspendTask) {
            suspendTask = true;
            task(onReady);
        }
    });

};