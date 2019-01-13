#!/usr/bin/env node

'use strict';

require('./helpers/update-notifier');
const meow = require('meow');
const aliases = require('aliases');
const serve = require('serve');
const chokidar = require('chokidar');
const process = require('process');

const rootCheck = require('root-check');
rootCheck(`You are not allowed to run this app with root permissions.
It’s recommended that you configure your system so that npm modules can be globally installed without requiring root.
Please refer to our Troubleshoot guide to learn how to do this: https://github.com/Financial-Times/origami-build-tools/blob/master/TROUBLESHOOT.md`);

const help = `
		Usage
			$ obt <command> [<options>]

		Commands
			build, b    Build CSS and JS in current directory
			demo, d     Build demos into the demos directory
			init        Initialise a new component with a boilerplate folder structure
			install, i  Install npm and bower dependencies required to build modules
			test, t     Run Origami specification tests and component specific tests
			verify, v   Check folder and code structure follows Origami specification

		Options
			-h, --help                 Print out this message
			--watch                    Re-run every time a file changes
			--run-server               Build demos locally and runs a server
			--port=<port>              The port to run the local server on if available (default: 8999).
			--js=<path>                Main JavaScript file (default: ./src/main.js)
			--sass=<path>              Main Sass file (default: ./src/main.scss)
			--build-js=<file>          Compiled JavaScript file (default: main.js)
			--build-css=<file>         Compiled CSS file (default: main.css)
			--build-folder=<dir>       Compiled assets directory (default: ./build/)
			-v, --version              Print out version of origami-build-tools
			--no-bower                 Ignore files related to the bower package manager
			--production               Compiled assets will be minified for production systems
			--browserstack             Run tests using Browserstack instead of Chrome Stable. Requires BROWSER_STACK_USERNAME and BROWSER_STACK_ACCESS_KEY to be set.
			--standalone               Create a named export for the built JavaScript
			--demo-filter=<demo-name>  Build a specific demo. E.G. --demo-filter=pa11y to build only the pa11y.html demo.
			--suppress-errors          Do not error if no demos are found when using the --demo-filter option.
			--debug                    Keep the test runner open to enable debugging in any browser.
			--verbose                  Output sass warnings with backtraces.

		Full documentation
			http://git.io/bBjMNw
`;

const cli = meow(help, {
	alias: aliases(help)
});

let server;
if (cli.flags.bower === false) {
	cli.flags.noBower = true;
}
if (cli.flags.runServer) {
	server = serve(cli.flags.cwd || process.cwd(), {
		port: cli.flags.port || 8999,
		ignore: ['node_modules']
	});
}

const argument = cli.input[0];
let task;
switch (argument) {
	case 'build':
	case 'b':
		task = require('./tasks/build');
		break;
	case 'init':
		task = require('./tasks/init');
		break;
	case 'demo':
	case 'd':
		task = require('./tasks/demo');
		break;
	case 'install':
	case 'i':
		task = require('./tasks/install');
		break;
	case 'test':
	case 't':
		task = require('./tasks/test');
		break;
	case 'verify':
	case 'v':
		task = require('./tasks/verify');
		break;
	default:
		cli.showHelp();
		process.exit(2); // eslint-disable-line no-process-exit
		break;
}

if (task && cli.flags.watch) {
	let childProcess;
	chokidar.watch(cli.flags.cwd || process.cwd(), {
		ignored: [
			'node_modules',
			cli.flags.buildFolder || 'build',
			'.git',
			'bower_components',
			'demos/local'
		],
		persistent: true,
		followSymlinks: true,
		ignoreInitial: true,
		cwd: cli.flags.cwd || process.cwd()
	})
		.on('all', function () {
			// Clear console
			console.log('\x1Bc');
			if (childProcess) {
				childProcess.kill();
			}

			childProcess = runWatchedTask(process.argv.slice(2));
		})
		.on('ready', function () {
			childProcess = runWatchedTask(process.argv.slice(2));
		});
} else if (task) {
	task(cli)
		.catch(() => {
			if (server) {
				server.stop();
			}
			process.exitCode = 2;
		});
}

function runWatchedTask(taskWithFlags) {
	console.log('Press crtl+c to exit.');
	const commandLine = require('./helpers/command-line');
	return commandLine.run(__filename, taskWithFlags.filter(flag => {
		return flag !== '--watch' && flag !== '--run-server' && flag !== '--runServer';
	}), {
		cwd: cli.flags.cwd || process.cwd()
	});
}
