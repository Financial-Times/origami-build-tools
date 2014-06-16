#! /usr/bin/env node
/*globals require, process */

"use strict";

var argv = require('minimist')(process.argv.slice(2)),
    installer = require('./commands/install'),
    builder = require('./commands/build'),
    tester = require('./commands/test'),
    verifier = require('./commands/verify'),
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

if (params.indexOf('verify') === 0) {
    verifier.run(function() {
        console.log('verified.');
    });
}

if (params.indexOf('demo') === 0) {
    var runDemo,
        configPath = (params && params[1]) ? params[1] : "demos/src/config.json",
        buildLocal = !!argv.local,
        updateOrigami = !!argv.updateorigami;
    runDemo = function(callback) {
        demo.run(configPath, buildLocal, updateOrigami, callback);
    };
    runDemo(function(error) {
        if (argv.watch) {
            watcher.run(runDemo);
        } else {
            process.exit(!!error ? 1 : 0);
        }
    });
}