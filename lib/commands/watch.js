'use strict';

var path = require('path'),
    gaze = require('gaze'),
    moment = require('moment'),
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
        '!demos/local/*',
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
        suspendTask = false;

    watcher.on('ready', function () {
        task(onComplete);
    });

    watcher.on('all', function(event, filepath) {
        log.primary(path.relative(process.cwd(), filepath) + ' ' + event);
        if (!suspendTask) {
            suspendTask = true;
            task(onComplete);
        }
    });

    function onComplete() {
        suspendTask = false;
        log.secondary('Task finished at ' + moment().format('HH:mm:ss') + '. Now watching for changes...');
    }
};
