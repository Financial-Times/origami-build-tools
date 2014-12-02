#! /usr/bin/env node

"use strict";

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
	console.log('   [--local]                    Build demos locally, and run them in a browser');
	console.log('   [--updateorigami]            Update origami.json with the latest demo files created');
	console.log('   [--js=<path>]                Main JavaScript file (default: ./src/main.js)');
	console.log('   [--sass=<path>]              Main Sass file (default: ./src/main.scss)');
	console.log('   [--buildJs=<file>]           Compiled JavaScript file (default: main.js)');
	console.log('   [--buildCss=<file>]          Compiled CSS file (default: main.css)');
	console.log('   [--buildFolder=<dir>]        Compiled assets directory (default: ./build/)');
	console.log('   [--scssLintPath=<path>]      Custom scss-lint configuration');
	console.log('   [--jsHintPath=<path>]        Custom JS Hint configuration');
	console.log('   [--editorconfigPath=<path>]  Custom .editorconfig');

	console.log('');
	console.log('Full documentation: http://git.io/bBjMNw');
}

var watch = !!argv.watch,
	argument = argv._[0];

if (tasks.hasOwnProperty(argument)) {
	var task = tasks[argument];

	if (watch && task.watchable) {
		watcher.run(task, gulp, argv);
	} else {
		task(gulp, argv);
	}
} else {
	if (argument) {
		log.primaryError(argument + ' is not a valid command');
	}

	printUsage(tasks);
	process.exit(2);
}
