#! /usr/bin/env node

'use strict';

const path = require('path');
const meow = require('meow');
const gulp = require('gulp');
const tasks = require('./origami-build-tools');
const log = require('./helpers/log');
const aliases = require('aliases');
const help = `
		Usage
			$ origami-build-tools <command> [<options>]

		Commands
			${printCommandInfoAligned(tasks.loadAll()).join('\n\t\t\t')}

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

function getLengthOfLongestCommand(commands) {
	const stringLengthComparison = function(a, b) {
		return a.length > b.length ? a : b;
	};

	const longestKey = Object.keys(commands).reduce(stringLengthComparison);
	return longestKey.length;
}

function printCommandInfoAligned(commands) {
	const longestCommandLength = getLengthOfLongestCommand(commands);

	return Object.keys(commands).map(function(command) {
		const alignment = new Array(longestCommandLength - command.length + 1).join(' ');
		return command + alignment + commands[command].description;
	});
}

function runWatcher(task, gulp, config) {
	const watchGlobs = [
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
	const watcher = gulp.watch(watchGlobs);

	if (typeof task !== 'function') {
		return;
	}
	watcher.on('ready', function() {
		log.secondary('Running tasks...');
		const taskResult = task(gulp, config);
		checkTaskResult(taskResult);
	});

	watcher.on('change', function(event) {
		log.secondary('File ' + event.path + ' was ' + event.type + ', running tasks...');
		const fileExtension = path.extname(event.path);
		if (fileExtension === '.js') {
			config.watching = 'js';
		} else if (fileExtension === '.scss') {
			config.watching = 'sass';
		}
		const taskResult = task(gulp, config);
		checkTaskResult(taskResult);
	});
}

const watch = !!cli.flags.watch;
const argument = cli.input[0];

function reportTaskError(error) {
	if (Array.isArray(error)) {
		log.primaryError(error.join('\n'));
	} else if (error) {
		log.primaryError(error);
	}
	process.exit(1);  // eslint-disable-line no-process-exit
}

function reportFinished() {
	log.primary('\nFinished running ' + argument);
}

function checkTaskResult(taskResult) {
	if (typeof taskResult !== 'undefined' && taskResult !== null) {
		// Check if the function returns a Promise
		if (taskResult instanceof Promise) {
			taskResult
				.then(reportFinished)
				.catch(reportTaskError);
		// Check if it's a stream
		} else if (taskResult.on && taskResult.resume) {
			taskResult
				.on('error', reportTaskError)
				.on('end', reportFinished);
			// Make sure it reaches 'end'
			taskResult.resume();
		}
	}
}

if (tasks.isValid(argument)) {
	const task = tasks[argument];

	if (watch && task.watchable) {
		runWatcher(task, gulp, cli);
	} else {
		const taskResult = task(gulp, cli);
		checkTaskResult(taskResult);
	}
} else {
	if (argument) {
		log.primaryError(argument + ' is not a valid command');
	}

	cli.showHelp();
	process.exit(2);  // eslint-disable-line no-process-exit
}
