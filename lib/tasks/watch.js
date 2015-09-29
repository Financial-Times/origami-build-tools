'use strict';

const path = require('path');
const log = require('../helpers/log');
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

module.exports = {
	run: function(task, gulp, config) {
		if (typeof task !== 'function') {
			return;
		}

		const watcher = gulp.watch(watchGlobs);

		watcher.on('ready', function() {
			log.secondary('Running tasks...');
			task(gulp, config);
		});

		watcher.on('change', function(event) {
			log.secondary('File ' + event.path + ' was ' + event.type + ', running tasks...');
			const fileExtension = path.extname(event.path);
			if (fileExtension === '.js') {
				config.watching = 'js';
			} else if (fileExtension === '.scss') {
				config.watching = 'sass';
			}
			task(gulp, config);
		});
	}
};
