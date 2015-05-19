'use strict';

var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var streamify = require('gulp-streamify');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var cleanCss = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var merge = require('merge-stream');
var gulpif = require('gulp-if-else');
var autoprefixer = require('gulp-autoprefixer');
var prefixer = require('../plugins/gulp-prefixer');
var files = require('../helpers/files');
var log = require('../helpers/log');

var textrequireify = require('textrequireify');
var debowerify = require('debowerify');
var babelify = require('babelify');

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
		var transforms = [babelify, debowerify, textrequireify.create({
			rootDirectory: process.cwd()
		})].concat(config.transforms || []);

		config.env = config.env || 'development';
		var useSourceMaps = config.sourcemaps === true || config.env === 'development';
		config.debug = useSourceMaps;

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
			.pipe(buffer())
			.pipe(gulpif(useSourceMaps, function() {
				return sourcemaps.init({loadMaps: true});
			}))
			.pipe(gulpif(config.env === 'production', function() {
				return streamify(uglify());
			}))
			.pipe(gulpif(useSourceMaps, function() {
				return sourcemaps.write();
			}))
			.pipe(gulpif(destFolder !== 'disabled', function() {
				return gulp.dest(destFolder);
			}));
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
		var useSourceMaps = config.sourcemaps === true || config.env === 'development';

		var sassConfig = {
			includePaths: ['bower_components'].concat(config.sassIncludePaths || []),
			outputStyle: config.env === 'production' ? 'compressed' : 'nested'
		};

		var autoprefixerConfig = {
			browsers: config.autoprefixerBrowsers || ['> 1%', 'last 2 versions', 'ie > 6', 'ff ESR'],
			cascade: config.autoprefixerCascade || false,
			remove: config.autoprefixerRemove === undefined ? true : config.autoprefixerRemove
		};

		return gulp.src(src)
			.pipe(gulpif(config.sassPrefix, function() {
				return prefixer(config.sassPrefix);
			}))
			.pipe(sass(sassConfig))
			.pipe(gulpif(useSourceMaps, function() {
				return sourcemaps.init({loadMaps: true});
			}))
			.pipe(autoprefixer(autoprefixerConfig))
			.pipe(gulpif(config.env === 'production', function() {
				return cleanCss(config.cleanCss || {
					advanced: false
				});
			}))
			.pipe(gulpif(useSourceMaps, function() {
				return sourcemaps.write();
			}))
			.pipe(rename(dest))
			.pipe(gulpif(destFolder !== 'disabled', function() {
				return gulp.dest(destFolder);
			}));
	}
};

module.exports.watchable = true;
module.exports.description = 'Build module in current directory';
