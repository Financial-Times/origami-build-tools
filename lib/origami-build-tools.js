#! /usr/bin/env node
/*globals require, process */

"use strict";

var argv = require('minimist')(process.argv.slice(2)),
	gulp = require('gulp'),
	watcher = require('./tasks/watch.js')(gulp),
	verifier = require('./tasks/verify')(gulp),
    // installer = require('./tasks/install')(gulp),
    // builder = require('./tasks/build')(gulp),
    // tester = require('./tasks/test')(gulp),
    // demo = require('./tasks/demo.js')(gulp),    
	help = require('./help.js'),
	log = require('./log'),
	fs = require('fs');

var params   = argv._,
	watch    = !!argv.watch,
	argument = params[0];

var tasks = {
	// 'install': {
	// 	watchable: false,
	// 	description: 'Installs Origami module and any additional required development tools',
	// 	createtask: function() {
	// 		return installer.run;
	// 	}
	// },
	// 'build': {
	// 	watchable: true,
	// 	description: 'Builds the Origami module',
	// 	createtask: function() {
	// 		return builder.run;
	// 	}
	// },
	// 'test': {
	// 	watchable: true,
	// 	description: 'Runs the test suite',
	// 	createtask: function() {
	// 		return tester.run;
	// 	}
	// },
	// 'demo':  {
	// 	watchable: true,
	// 	description: 'Builds the demonstrations',
	// 	createtask: function() {
	// 		var configPath = (params && params[1]) ? params[1] : null,
	// 			buildLocal = !!argv.local,
	// 			updateOrigami = !!argv.updateorigami;
	// 		if (!configPath) {
	// 			["demos/src/config.json", "demos/src/config.js"].forEach(function(path) {
	// 				if (fs.existsSync(path)) {
	// 					configPath = path;
	// 					return false;
	// 				}
	// 			});
	// 		}
	// 		return function(callback) {
	// 			demo.run(configPath, buildLocal, updateOrigami, callback);
	// 		};
	// 	}
	// },
	'verify': {
		watchable: true,
		description: 'Verify the module\'s conformity to the specification',
		createtask: function() {
			return verifier.run;
		}
	}
};

if (tasks.hasOwnProperty(argument)) {
	var task = tasks[argument],
		task = task.createtask(gulp);

	if (watch && task.watchable) {
		watcher.run(task);
	} else {
		task(function(error) {
			process.exit(!!error ? 1 : 0);
		});
	}
} else {
	if (argument) {
		log.primaryError(argument + ' is not a valid command');
	}

	help.printUsage(tasks);
	process.exit(2);
}
