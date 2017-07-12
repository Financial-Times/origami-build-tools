#!/usr/bin/env node

'use strict';

require('./helpers/update-notifier');
const meow = require('meow');
const aliases = require('aliases');
const serve = require('serve');
const process = require('process');

const rootCheck = require('root-check');
rootCheck(`You are not allowed to run this app with root permissions.
It’s recommended that you configure your system so that npm modules can be globally installed without requiring root.
Please refer to our Troubleshoot guide to learn how to do this: https://github.com/Financial-Times/origami-build-tools/blob/master/TROUBLESHOOT.md`);

const help = `
		Usage
			$ obt <command> [<options>]

		Commands
			build   Build CSS and JS in current directory
			demo    Build demos into the demos directory
			install Install dependencies in current directory
			test    Run Origami specification tests and component specific tests
			verify  Check folder and code structure follows Origami specification

		Options
			-h, --help                 Print out this message
			--watch                    Re-run every time a file changes
			--run-server               Build demos locally and runs a server
			--js=<path>                Main JavaScript file (default: ./src/main.js)
			--sass=<path>              Main Sass file (default: ./src/main.scss)
			--build-js=<file>          Compiled JavaScript file (default: main.js)
			--build-css=<file>         Compiled CSS file (default: main.css)
			--build-folder=<dir>       Compiled assets directory (default: ./build/)
			-v, --version              Print out version of origami-build-tools
			--production               Compiled assets will be minified for production systems

		Full documentation
			http://git.io/bBjMNw
`;

const cli = meow(help, {
	alias: aliases(help)
});

let server;
if (cli.flags.runServer) {
	server = serve(process.cwd(), {
		port: 8999,
		ignore: ['node_modules']
	});
}

const argument = cli.input[0];
let task;
switch (argument) {
case 'build':
	task = require('./tasks/build');
	break;
case 'demo':
	task = require('./tasks/demo');
	break;
case 'install':
	task = require('./tasks/install');
	break;
case 'test':
	task = require('./tasks/test');
	break;
case 'verify':
	task = require('./tasks/verify');
	break;
default:
	cli.showHelp();
	process.exit(2); // eslint-disable-line no-process-exit
	break;
}

if (task) {
	task(cli)
		.catch(() => {
			if (server) {
				server.stop();
			}
			process.exitCode = 2;
		});
}
