/*global require, module, process */

var path = require('path'),
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

module.exports = function(gulp) {
    return {
        run: function(task) {
            "use strict";

            if (typeof task !== "function") {
                return;
            }

            var watcher = gulp.watch(watchGlobs),
                suspendTask = false;

            watcher.on('ready', function () {
                task(onComplete);
            });

            watcher.on('change', function(event) {
                log.primary(path.relative(process.cwd(), event.path) + ' ' + event.type);
                if (!suspendTask) {
                    suspendTask = true;
                    task(onComplete);
                }
            });

            function onComplete() {
                suspendTask = false;
                log.secondary('Task finished at ' + moment().format('HH:mm:ss') + '. Now watching for changes...');
            }
        }
    }
}
