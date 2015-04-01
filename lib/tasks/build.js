"use strict";

var browserify = require('browserify');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
var sass = require('gulp-ruby-sass');
var cleanCss = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var gulpif = require('gulp-if');
var merge = require('merge-stream');
var autoprefixer = require('gulp-autoprefixer');
var files = require('../helpers/files');
var log = require('../helpers/log');
var hash = require('gulp-hash');

var textrequireify = require('textrequireify');
var debowerify = require('debowerify');
var babelify = require('babelify');

var hashOptions = {
	algorithm: 'sha1',
	hashLength: 10,
	template: '<%= name %>-<%= hash %><%= ext %>'
};

module.exports = function(gulp, config) {
	var jsStream = module.exports.js(gulp, config);
	var sassStream = module.exports.sass(gulp, config);
	if (jsStream && sassStream) {
		return merge(jsStream, sassStream);
	}
	return jsStream || sassStream;
};

module.exports.js = function(gulp, config) {
	config = config || {};
	var src = config.js || files.getMainJsPath() || null;
	if (src) {
		// See; https://github.com/substack/node-browserify#btransformtr-opts
		var transforms = [babelify, debowerify, textrequireify].concat(config.transforms || []);

		var useSourceMaps = config.sourcemaps === true;
		config.env = config.env || 'development';
		config.debug = useSourceMaps || config.env === 'development';

		var destFolder = config.buildFolder || files.getBuildFolderPath();
		var dest = config.buildJs || 'main.js';

		log.secondary("Browserifying " + src);

		var bundle = browserify(config)
			.add(src)
			.require(src, { entry: true });

		bundle = transforms.reduce(function(bundle, transform) {
			return bundle.transform(transform);
		}, bundle);

		return bundle.bundle()
			.pipe(source(dest))
			.pipe(gulpif(config.env === 'production', streamify(uglify())))
			.pipe(gulpif(config.hash === true, streamify(hash(hashOptions))))
			.pipe(gulpif(config.hash === true, gulp.dest(destFolder)))
			.pipe(gulpif(config.hash === true, hash.manifest(dest + '-asset-hash.json')))
			.pipe(gulp.dest(destFolder));
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
			loadPath: ['.', 'bower_components'],
			// Hack: we're waiting for gulp-ruby-sass v1 to be released, with better support for soucemaps
			"sourcemap=none": true
		};

		var autoprefixerConfig = {
			browsers: config.autoprefixerBrowsers || ['> 1%', 'last 2 versions', 'ie > 6', 'ff ESR'],
			cascade: config.autoprefixerCascade || false,
			remove: config.autoprefixerRemove === undefined ? true : config.autoprefixerRemove
		};

		if (config.env === 'production') {
			sassConfig.style = 'compressed';
		}
		return gulp.src(src)
			.pipe(sass(sassConfig))
			.on('error', function(err) { throw err; })
			.pipe(autoprefixer(autoprefixerConfig))
			.pipe(gulpif(config.env === 'production', cleanCss(config.cleanCss || {
				advanced: false
			})))
			.pipe(rename(dest))
			.pipe(gulpif(config.hash === true, hash(hashOptions)))
			.pipe(gulpif(config.hash === true, gulp.dest(destFolder)))
			.pipe(gulpif(config.hash === true, hash.manifest(dest + '-asset-hash.json')))
			.pipe(gulp.dest(destFolder));
	}
};

module.exports.watchable = true;
module.exports.description = 'Build module in current directory';
