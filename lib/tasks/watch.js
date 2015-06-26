'use strict';

var path = require('path');
var log = require('../helpers/log');
var checkTaskStatus = require('../helpers/taskstatus');
var notifier = require('node-notifier');

var watchGlobs = [
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

function reportTaskComplete(taskResult, builtExtensions) {

	checkTaskStatus(taskResult, function(err, result) {

		var notificationTitle = "Build succeeded";
		var notificationContent = "Your " + builtExtensions.join(" and ") + " ";
		if (err) {
			notificationTitle = "Build failed";
			notificationContent += "has failed to build.";
		} else {
			notificationContent += "was successfully built.";
		}

		log.primary(notificationContent);
		notifier.notify({
			title: notificationTitle,
			message: notificationContent,
			icon: path.join(__dirname, '../helpers/origami.png')
		});
	});
};

module.exports = {
	run: function(task, gulp, config) {
		if (typeof task !== 'function') {
			return;
		}

		var watcher = gulp.watch(watchGlobs);

		watcher.on('ready', function() {
			log.secondary('Running tasks...');
			reportTaskComplete(task(gulp, config), ['js', 'css']);
		});

		watcher.on('change', function(event) {
			log.secondary('File ' + event.path + ' was ' + event.type + ', running tasks...');
			var fileExtension = path.extname(event.path);
			if (fileExtension === '.js') {
				config.watching = 'js';
			} else if (fileExtension === '.scss') {
				config.watching = 'sass';
			}
			reportTaskComplete(task(gulp, config), [ config.watching ]);
		});
	}
};
