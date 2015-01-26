"use strict";

var browserify = require('browserify');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
var sass = require('gulp-ruby-sass');
var csso = require('gulp-csso');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var gulpif = require('gulp-if');
var merge = require('merge-stream');
var autoprefixer = require('gulp-autoprefixer');
var files = require('../helpers/files');
var log = require('../helpers/log');
var hash = require('gulp-hash');

var hashOptions = {
	algorithm: 'sha1',
	hashLength: 10,
	template: '<%= name %>-<%= hash %><%= ext %>'
};

module.exports = function(gulp, config) {
	var jsStream = module.exports.js(gulp, config);
	var sassStream = module.exports.sass(gulp, config);
	if( jsStream && sassStream ){
		return merge(jsStream, sassStream);
	}

	return jsStream || sassStream;
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

		var useSourceMaps = config.sourcemaps === true;

		config.env = config.env || 'development';

		config.debug = useSourceMaps || config.env === 'development';

		var destFolder = config.buildFolder || files.getBuildFolderPath();
		var dest = config.buildJs || 'main.js';

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

		return bundle.bundle(config)
			.pipe(source(dest))
			.pipe(gulpif(config.env === 'production', streamify(uglify())))
			.pipe(gulpif(config.hash, streamify(hash(hashOptions))))
			.pipe(gulpif(config.hash, gulp.dest(destFolder)))
			.pipe(gulpif(config.hash, hash.manifest(dest + '-asset-hash.json')))
			.pipe(gulp.dest(destFolder));
	} else {
		throw Error('Invalid path to main JavaScript file');
	}
};

module.exports.sass = function(gulp, config) {
	config = config || {};
	var src = config.sass || files.getMainSassPath() || null;
	if (src) {
		var destFolder = config.buildFolder || files.getBuildFolderPath();
		var dest = config.buildCss || 'main.css';

		log.secondary("Compiling " + src);

		config.env = config.env || 'development';

		var sassConfig = {
			loadPath: ['.', 'bower_components']
		};

		var autoprefixerConfig = {
			browsers: config.autoprefixerBrowsers || ['> 1%', 'last 2 versions', 'ie > 6', 'ff ESR'],
			cascade: config.autoprefixerCascade || false,
			remove: config.autoprefixerRemove === undefined ? true : config.autoprefixerRemove
		};

		if (config.env === 'production') {
			sassConfig.style = 'compressed';
		}
		// Sourcemaps aren't compatible with csso, we'll look for a work-around when gulp-ruby-sass 1.0 is released
		// in the time being, we disable them explicitly
		sassConfig.sourcemap = false;
		// if (config.sourcemap) {
		//     sassConfig.sourcemap = config.sourcemap;
		// }
		// if (config.sourcemapPath) {
		//     sassConfig.sourcemapPath = config.sourcemapPath;
		// }
		return gulp.src(src)
			.pipe(sass(sassConfig))
			.on('error', function(err) { throw err; });
			.pipe(autoprefixer(autoprefixerConfig))
			.pipe(gulpif(config.env === 'production', csso()))
			.pipe(rename(dest))
			.pipe(gulpif(config.hash, hash(hashOptions)))
			.pipe(gulpif(config.hash, gulp.dest(destFolder)))
			.pipe(gulpif(config.hash, hash.manifest(dest + '-asset-hash.json')))
			.pipe(gulp.dest(destFolder));
	} else {
		throw Error('Invalid path to main Sass file');
	}
};

module.exports.watchable = true;
module.exports.description = 'Build module in current directory';
