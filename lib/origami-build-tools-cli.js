#! /usr/bin/env node

/*globals require, process */
"use strict";

var argv = require('minimist')(process.argv.slice(2)),
	gulp = require('gulp'),
	tasks = require('./origami-build-tools'),
	watcher = require('./tasks/watch.js'), 
	log = require('./helpers/log'),
	fs = require('fs');

var params   = argv._,
	watch    = !!argv.watch,
	argument = params[0];

function getLengthOfLongestCommand(commands) {
	var stringLengthComparison = function(a, b) {
		return a.length > b.length ? a : b;
	}

	var longestKey = Object.keys(commands).reduce(stringLengthComparison);
	return longestKey.length
}

function printCommandInfoAligned(commands) {
	var longestCommandLength = getLengthOfLongestCommand(commands);

	Object.keys(commands).forEach(function(command) {
		var alignment = new Array(longestCommandLength - command.length + 1).join(' ');
		console.log(
				command,
				alignment + ' - ',
				commands[command].description,
				commands[command].watchable ? 'Optional: --watch' : '');
	})
}

function printUsage(commands) {
	log.primary('Available commands:');
	printCommandInfoAligned(commands);
};

if (tasks.hasOwnProperty(argument)) {
	var task = tasks[argument];

	if (watch && task.watchable) {
		watcher.run(gulp, task);
	} else {
		task(gulp);
	}
} else {
	if (argument) {
		log.primaryError(argument + ' is not a valid command');
	}

	printUsage(tasks);
	process.exit(2);
}