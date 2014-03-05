#! /usr/bin/env node
/*globals require */

"use strict";

var installer = require('./commands/install'),
    test = require('./commands/test');

var userArgs = process.argv.slice(2);

if (userArgs[0] === 'install') {
    installer.run();
}

if (userArgs[0] === 'test') {
    test.sassSilence();
}