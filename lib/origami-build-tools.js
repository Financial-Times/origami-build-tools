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
    builder.run(function(error) {
        if (argv.watch) {
            watcher.run(builder.run);
        } else {
            process.exit(!!error ? 1 : 0);
        }
    });
}

if (params.indexOf('test') === 0) {
    tester.run(function(error) {
        if (argv.watch) {
            watcher.run(tester.run);
        } else {
            process.exit(!!error ? 1 : 0);
        }
    });
}

if (params.indexOf('demo') === 0) {
    var runDemo,
        staticSource = 'buildservice';
    if (params[1]) {
        if (argv.local) {
            staticSource = 'local';
        }
        runDemo = function(callback) {
            demo.run(params[1], staticSource, callback);
        };
        runDemo(function(error) {
            if (argv.watch) {
                watcher.run(runDemo);
            } else {
                process.exit(!!error ? 1 : 0);
            }
        });
    }
}