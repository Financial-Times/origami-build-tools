// Code taken from https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/guidelines.md because this plugin isn't on npm
// It prefixes a string to a file
'use strict';

var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

// consts
var PLUGIN_NAME = 'gulp-prefixer';

function prefixStream(prefixText) {
	var stream = through();
	stream.write(prefixText);
	return stream;
}

// plugin level function (dealing with files)
function gulpPrefixer(prefixText) {
	if (typeof prefixText !== 'string') {
			throw new PluginError(PLUGIN_NAME, 'Missing prefix text!');
	}

	prefixText = new Buffer(prefixText); // allocate ahead of time

	// creating a stream through which each file will pass
	var stream = through.obj(function(file, enc, cb) {
		if (file.isBuffer()) {
			file.contents = Buffer.concat([prefixText, file.contents]);
		}

		if (file.isStream()) {
			file.contents = file.contents.pipe(prefixStream(prefixText));
		}

		this.push(file);
		return cb();
	});

	// returning the file stream
	return stream;
}

// exporting the plugin main function
module.exports = gulpPrefixer;
