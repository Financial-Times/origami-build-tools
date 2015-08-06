#! /usr/bin/env node

'use strict';

var argv = require('minimist')(process.argv.slice(2));
var gulp = require('gulp');
var tasks = require('./origami-build-tools');
var watcher = require('./tasks/watch.js');
var log = require('./helpers/log');

function getLengthOfLongestCommand(commands) {
	var stringLengthComparison = function(a, b) {
		return a.length > b.length ? a : b;
	};

	var longestKey = Object.keys(commands).reduce(stringLengthComparison);
	return longestKey.length;
}

function printCommandInfoAligned(commands) {
	var longestCommandLength = getLengthOfLongestCommand(commands);

	Object.keys(commands).forEach(function(command) {
		var alignment = new Array(longestCommandLength - command.length + 1).join(' ');
		console.log(
			'  ',
			command,
			alignment,
			commands[command].description
		);
	});
}

function printUsage(commands) {
	console.log('Usage: origami-build-tools <command> [<options>]');
	console.log('');
	console.log('Commands:');
	printCommandInfoAligned(commands);
	console.log('');
	console.log('Mostly used options include:');
	console.log('   [--watch]                    Re-run every time a file changes');
	console.log('   [--runServer]                Build demos locally and runs a server');
	console.log('   [--updateorigami]            Update origami.json with the latest demo files created');
	console.log('   [--js=<path>]                Main JavaScript file (default: ./src/main.js)');
	console.log('   [--sass=<path>]              Main Sass file (default: ./src/main.scss)');
	console.log('   [--buildJs=<file>]           Compiled JavaScript file (default: main.js)');
	console.log('   [--buildCss=<file>]          Compiled CSS file (default: main.css)');
	console.log('   [--buildFolder=<dir>]        Compiled assets directory (default: ./build/)');
	console.log('   [--scssLintPath=<path>]      Custom scss-lint configuration');
	console.log('   [--esLintPath=<path>]        Custom esLint configuration');
	console.log('   [--editorconfigPath=<path>]  Custom .editorconfig');
	console.log('   [--npmRegistry=<url>]        Custom npm registry');
	console.log('');
	console.log('Full documentation: http://git.io/bBjMNw');
}

// Mini-hack to make Origami Build Tools support the pseudo standard CLI language of --version
if (argv.version) {
	delete argv.version;
	argv._[0] = '--version';
}

var watch = !!argv.watch;
var argument = argv._[0];

function reportTaskError(error) {
	if (Array.isArray(error)) {
		log.primaryError(error.join('\n'));
	} else if (error) {
		log.primaryError(error);
	}
	process.exit(1);  // eslint-disable-line no-process-exit
}

function reportFinished() {
	log.primary('Finished running ' + argument);
}

if (tasks.isValid(argument)) {
	var task = tasks[argument];

	if (watch && task.watchable) {
		watcher.run(task, gulp, argv);
	} else {
		var taskResult = task(gulp, argv);

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
} else {
	if (argument) {
		log.primaryError(argument + ' is not a valid command');
	}

	printUsage(tasks.loadAll());
	process.exit(2);  // eslint-disable-line no-process-exit
}
