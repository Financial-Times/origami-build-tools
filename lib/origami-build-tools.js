#! /usr/bin/env node
/*globals require, process */

"use strict";

var argv = require('minimist')(process.argv.slice(2)),
    installer = require('./commands/install'),
    builder = require('./commands/build'),
    tester = require('./commands/test'),
    demo = require('./commands/demo.js');

var params = argv._;

if (params.indexOf('install') === 0) {
    installer.run();
}

if (params.indexOf('build') === 0) {
    builder.run();
}

if (params.indexOf('test') === 0) {
    tester.run();
}

if (params.indexOf('demo') === 0) {
    if (params[1]) {
        if (argv.local) {
            demo.local(params[1]);
        }
        if (argv.buildservice) {
            demo.buildService(params[1]);
        }
    }
    // TODO: Verify contents of origami.json
}