'use strict';

var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

var log = require('../helpers/log.js');

// consts
var PLUGIN_NAME = 'gulp-silent-sass';
var stream;

function testSass(config, css) {
	if ((config.silent && css.length === 0) || (!config.silent && css.length > 0)) {
		log.primary('sass compilation for silent mode: ' + config.silent + ' passed.');
	} else {
		stream.emit('error', new gutil.PluginError(PLUGIN_NAME, {
			message: 'sass compilation for silent mode: ' + config.silent + ' failed.',
			showStack: false
		}));
	}
}

function gulpSilentSass(config) {
	if (!config) {
		throw new PluginError(PLUGIN_NAME, 'Missing config');
	}

	// creating a stream through which each file will pass
	stream = through.obj(function(file, enc, cb) {
		if (file.isBuffer()) {
			testSass(config, file.contents.toString());
		}

		if (file.isStream()) {
			this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
		}

		this.push(file);
		cb();
	});

	// Make the stream resume emitting data events so that it reaches the end event
	stream.resume();
	// returning the file stream
	return stream;
}

module.exports = gulpSilentSass;
