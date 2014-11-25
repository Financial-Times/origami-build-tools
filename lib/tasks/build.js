"use strict";

var browserify = require('browserify'),
	source = require('vinyl-source-stream'),
	streamify = require('gulp-streamify'),
	sass = require('gulp-ruby-sass'),
	csso = require('gulp-csso'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
	gulpif = require('gulp-if'),
	autoprefixer = require('gulp-autoprefixer'),
	files = require('../helpers/files'),
	log = require('../helpers/log');

module.exports = function(gulp, config) {
	module.exports.js(gulp, config);
	module.exports.sass(gulp, config);
};

module.exports.js = function(gulp, config) {
	config = config || {};
	var src = config.js || files.getMainJsPath() || null;
	if (src) {
		var transforms = ['debowerify', 'textrequireify'].concat(config.transforms || []);
		delete config.transforms;

		// Hackily shallow clone the config object
		config = Object.keys(config).reduce(function(newConfig, current) {
			newConfig[current] = config[current];
			return newConfig;
		}, {});

		config.env = config.env || 'development';

		config.debug = config.env === 'development';

		var destFolder = config.buildFolder || files.getBuildFolderPath(),
			dest = config.buildJs || 'main.js';

		log.secondary("Browserifying " + src);

		var bundle = browserify(src)
			.require(src, {});

		transforms.forEach(function(transform) {
			// the usual use case - most of the time transforms work without needing any custom config
			if (typeof transform === 'string') {
				bundle.transform({}, transform);
			// sometimes a config option is needed too, in which case the user will pass in an array [config, 'transform-name']
			} else if (transform.length === 2) {
				bundle.transform.apply(bundle, transform);
			// some transforms use a seemingly undocumented (deprecated?) API where they pass in an object generated using the transform's own js API
			} else {
				bundle.transform(transform);
			}
		});

		bundle.bundle(config)
			.pipe(source(dest))
			.pipe(gulpif(config.env === 'production', streamify(uglify())))
			.pipe(gulp.dest(destFolder));
	}
};

module.exports.sass = function(gulp, config) {
	config = config || {};
	var src = config.sass || files.getMainSassPath() || null;
	if (src) {
		var destFolder = config.buildFolder || files.getBuildFolderPath(),
			dest = config.buildCss || 'main.css';
		log.secondary("Compiling " + src);

		config.env = config.env || 'development';

		var sassConfig = {
			loadPath: ['.', 'bower_components']
		};

		var autoprefixerConfig = {
			browsers: config.autoprefixerBrowsers || ['> 1%', 'last 2 versions', 'ie > 6', 'ff ESR'],
			cascade: config.autoprefixerCascade || false,
			remove: config.autoprefixerRemove || true
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
			.pipe(autoprefixer(autoprefixerConfig))
			.pipe(gulpif(config.env === 'production', csso()))
			.pipe(rename(dest))
			.pipe(gulp.dest(destFolder))
			.on('error', function(err) { console.log(err.message);});
	}
};

module.exports.watchable = true;
module.exports.description = 'Builds the Origami module';
