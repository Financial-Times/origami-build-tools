/*global require, module, process */

var path = require('path'),
    log = require('../helpers/log'),
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

module.exports = {
    run: function(task, gulp, config) {
        "use strict";

        if (typeof task !== "function") {
            return;
        }

        var watcher = gulp.watch(watchGlobs);

        watcher.on('ready', function() {
            log.secondary('Running tasks...');
            task(gulp, config);
        });

        watcher.on('change', function(event) {
            log.secondary('File ' + event.path + ' was ' + event.type + ', running tasks...');
            task(gulp, config);
        });
    }
}
