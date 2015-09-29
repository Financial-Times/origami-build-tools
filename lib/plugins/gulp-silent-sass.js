'use strict';

const through = require('through2');
const gutil = require('gulp-util');
const PluginError = gutil.PluginError;

const log = require('../helpers/log.js');

// consts
const PLUGIN_NAME = 'gulp-silent-sass';

function testSass(config, stream, css) {
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
	const stream = through.obj(function(file, enc, cb) {
		if (file.isBuffer()) {
			testSass(config, this, file.contents.toString());
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
