#!/usr/bin/env node

'use strict';

require('./helpers/update-notifier');
const meow = require('meow');
const aliases = require('aliases');
const serve = require('serve');

const rootCheck = require('root-check');
rootCheck(`You are not allowed to run this app with root permissions.
It’s recommended that you configure your system so that npm modules can be globally installed without requiring root.
Please refer to our Troubleshoot guide to learn how to do this: https://github.com/Financial-Times/origami-build-tools/blob/master/TROUBLESHOOT.md`);

const help = `
		Usage
			$ obt <command> [<options>]

		Commands
			build   Build module in current directory
			demo    Build demos into the demos directory
			install Install system and local dependencies
			test    Test if Sass silent compilation follows the Origami specification
			verify  Lint code and verify if module structure follows the Origami specification

		Options
			-h, --help                 Print out this message
			--watch                    Re-run every time a file changes
			--run-server               Build demos locally and runs a server
			--updateorigami            Update origami.json with the latest demo files created
			--js=<path>                Main JavaScript file (default: ./src/main.js)
			--sass=<path>              Main Sass file (default: ./src/main.scss)
			--build-js=<file>          Compiled JavaScript file (default: main.js)
			--build-css=<file>         Compiled CSS file (default: main.css)
			--build-folder=<dir>       Compiled assets directory (default: ./build/)
			--sasslint-path=<path>     Custom sass-lint configuration
			--eslint-path=<path>       Custom eslint configuration
			--editorconfig-path=<path> Custom .editorconfig
			--npm-registry=<url>       Custom npm registry

		Full documentation
			http://git.io/bBjMNw
`;

const cli = meow(help, {
	alias: aliases(help)
});

const argument = cli.input[0];

let task;

switch (argument) {
case 'build':
	task = require('./tasks/build')(cli);
	break;
case 'demo':
	task = require('./tasks/demo')(cli);
	break;
case 'install':
	task = require('./tasks/install')();
	break;
case 'test':
	task = require('./tasks/test')(cli);
	break;
case 'verify':
	task = require('./tasks/verify')(cli);
	break;
default:
	cli.showHelp();
	process.exit(2); // eslint-disable-line no-process-exit
	break;
}

if (task) {
	if (cli.flags.runServer) {
		task.then(() => {
			serve(process.cwd(), {
				port: 8080
			});
		}).catch(() => {
			process.exit(2);
		});
	}
}
