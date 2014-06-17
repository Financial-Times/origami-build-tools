#! /usr/bin/env node
/*globals require, process */

"use strict";

var argv = require('minimist')(process.argv.slice(2)),
    installer = require('./commands/install'),
    builder = require('./commands/build'),
    tester = require('./commands/test'),
    verifier = require('./commands/verify'),
    demo = require('./commands/demo.js'),
    watcher = require('./commands/watch.js'),
	log = require('./log');

var params   = argv._,
	watch    = !!argv.watch,
	argument = params[0];

var commands = {
	'install': {
		watchable: false,
		createtask: function() {
			return installer.run;
		}
	},
	'build': {
		watchable: true,
		createtask: function() {
			return builder.run;
		}
	},
	'test': {
		watchable: true,
		createtask: function() {
			return tester.run;
		}
	},
	'demo':  {
		watchable: true,
		createtask: function() {
			var configPath = (params && params[1]) ? params[1] : "demos/src/config.json",
				buildLocal = !!argv.local,
				updateOrigami = !!argv.updateorigami;
			return function(callback) {
				demo.run(configPath, buildLocal, updateOrigami, callback);
			};
		}
	},
	'verify': {
		watchable: true,
		createtask: function() {
			return verifier.run;
		}
	}
};

if (commands.hasOwnProperty(argument)) {
	var command = commands[argument],
		task = command.createtask();

	if (watch && command.watchable) {
		watcher.run(task);
	} else {
		task(function(error) {
			process.exit(!!error ? 1 : 0);
		});
	}
} else {
	// Command not a command
	log.primaryError(argument + ' not a command');
}
