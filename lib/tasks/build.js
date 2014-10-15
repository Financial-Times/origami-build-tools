"use strict";

var browserify = require('browserify'),
	source = require('vinyl-source-stream'),
	streamify = require('gulp-streamify'),
	sass = require('gulp-ruby-sass'),
	csso = require('gulp-csso'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
	gulpif = require('gulp-if'),
	files = require('../helpers/files'),
	log = require('../helpers/log');

module.exports = function(gulp, config) {
	module.exports.js(gulp, config);
	module.exports.sass(gulp, config);
};

module.exports.js = function(gulp, config) {
	var src = config.js || files.getMainJsPath() || null;
	if (src) {
		// Hackily shallow clone the config object
		config = Object.keys(config).reduce(function(prev, cur, ind, arr) {
			prev[cur] = config[cur];
			return prev;
		}, {});
		config.debug = config.env === 'development';

		var destFolder = config.buildFolder || files.getBuildFolderPath(),
			dest = config.buildJs || 'main.js';
		log.secondary("Browserifying " + src);
		if (!config.env) {
			config.env = 'development';
		}

		return browserify(src)
			.require(src, {})
			.transform({}, 'debowerify')
			.transform({}, 'textrequireify')
			.bundle(config)
			.pipe(source(dest))
			.pipe(gulpif(config.env === 'production', streamify(uglify())))
			.pipe(gulp.dest(destFolder));
	}
};

module.exports.sass = function(gulp, config) {
	var src = config.sass || files.getMainSassPath() || null;
	if (src) {
			var destFolder = config.buildFolder || files.getBuildFolderPath(),
				dest = config.buildCss || 'main.css';
			log.secondary("Compiling " + src);
			if (!config.env) {
				config.env = 'development';
			}
			var sassConfig = {
				loadPath: ['.', 'bower_components']
			};
			if (config.env === 'production') {
				sassConfig.style = 'compressed';
			}
			// Sourcemaps aren't compatible with csso, we'll look for a work-around when gulp-ruby-sass 1.0 is released
			// if (config.sourcemap) {
			//     sassConfig.sourcemap = config.sourcemap;
			// }
			// if (config.sourcemapPath) {
			//     sassConfig.sourcemapPath = config.sourcemapPath;
			// }
			return gulp.src(src)
				.pipe(sass(sassConfig))
				.pipe(gulpif(config.env === 'production', csso()))
				.pipe(rename(dest))
				.pipe(gulp.dest(destFolder))
				.on('error', function(err) { console.log(err.message);});
	}
};


module.exports.watchable = true;
module.exports.description = 'Builds the Origami module';
