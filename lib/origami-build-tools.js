#! /usr/bin/env node

"use strict";

var installer = require("./commands/install");

var userArgs = process.argv.slice(2);

if (userArgs[0] === "install") {
    installer.run();
}