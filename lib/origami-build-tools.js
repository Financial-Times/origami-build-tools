/*globals require */

"use strict";

var	verifier = require('./tasks/verify'),
    installer = require('./tasks/install');
    // builder = require('./tasks/build'),
    // tester = require('./tasks/test'),
    // demo = require('./tasks/demo.js');

var tasks = {
	'install': installer,
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
	'verify': verifier
};

module.exports = tasks;