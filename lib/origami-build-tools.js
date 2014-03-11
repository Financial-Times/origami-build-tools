#! /usr/bin/env node
/*globals require, process */

"use strict";

var argv = require('minimist')(process.argv.slice(2)),
    installer = require('./commands/install'),
    builder = require('./commands/build'),
    tester = require('./commands/test'),
    demo = require('./commands/demo.js'),
    watcher = require('./commands/watch.js');

var params = argv._;

if (params.indexOf('install') === 0) {
    installer.run();
}

if (params.indexOf('build') === 0) {
    builder.run(function() {
        if (argv.watch) {
            watcher.run(builder.run);
        }
    });
}

if (params.indexOf('test') === 0) {
    tester.run(function() {
        if (argv.watch) {
            watcher.run(tester.run);
        }
    });
}

if (params.indexOf('demo') === 0) {
    var task;
    if (params[1]) {
        if (argv.local) {
            task = function(callback) {
                demo.local(params[1], callback);
            };
        }
        if (argv.buildservice) {
            task = function(callback) {
                demo.buildService(params[1], callback);
            };
        }
        task(function() {
            if (argv.watch) {
                watcher.run(task);
            }
        });
    }
}