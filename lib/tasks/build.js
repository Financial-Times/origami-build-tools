'use strict';

var path = require('path');
var merge = require('merge-stream');
var BowerPlugin = require('bower-webpack-plugin');
var webpack = require('webpack-stream');
var combine = require('stream-combiner2');
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

module.exports = function(gulp, config) {
	var jsStream;
	var sassStream;
	if (typeof config.watching === 'undefined' || config.watching === 'js') {
		jsStream = module.exports.js(gulp, config);
	}
	if (typeof config.watching === 'undefined' || config.watching === 'sass') {
		sassStream = module.exports.sass(gulp, config);
	}
	if (jsStream && sassStream) {
		return merge(jsStream, sassStream);
	}
	return jsStream || sassStream;
};

module.exports.js = function(gulp, config) {
	config = config || {};
	var src = config.js || files.getMainJsPath() || null;
	var cwd = config.cwd || process.cwd();
	if (src) {
		// Temporary fix as aliased loaders don't pass in queries due to webpack bug
		var textrequireifyPath = path.join(__dirname, '../plugins/textrequireify-loader.js');

		var loaders = [textrequireifyPath + '?cwd=' + cwd, 'babel-runtime-path-loader', 'babel?optional[]=runtime', 'imports?define=>false'].concat(config.loaders || []);

		config.env = config.env || 'development';

		var useSourceMaps = config.sourcemaps === true || config.env === 'development';

		var destFolder = config.buildFolder || files.getBuildFolderPath();
		var dest = config.buildJs || 'main.js';

		log.secondary('Webpacking ' + src);

		var webpackConfig = {
			quiet: true,
			resolve: {
				root: [path.join(cwd, 'bower_components')]
			},
			resolveLoader: {
				root: [path.join(__dirname, '../../node_modules')],
				alias: {
					'babel-runtime-path-loader': path.join(__dirname, '../plugins/babelRuntimePathResolver'),
					'textrequireify-loader': path.join(__dirname, '../plugins/textrequireify-loader')
				}
			},
			plugins: [
				new BowerPlugin({
					includes:  /\.js$/
				})
			],
			module: {
				loaders: [
					{
						test: /\.js$/,
						exclude: /node_modules/,
						loaders: loaders
					},
					{
						test: /\.json$/,
						loader: 'json'
					}
				]
			},
			output: {
				filename: dest
			}
		};

		var combinedStream = combine.obj(
			gulp.src(src),
			webpack(webpackConfig),
			gulpif(useSourceMaps, function() {
				return sourcemaps.init({loadMaps: true})
			}),
			gulpif(config.env === 'production', function() {
				return streamify(uglify());
			}),
			gulpif(useSourceMaps, function() {
				return sourcemaps.write();
			}),
			gulpif(destFolder !== 'disabled', function() {
				return gulp.dest(destFolder)
			})
		);

		// Returns a combined stream so an error handler can be attached to the end of the pipeline,
		// and it will have effects in all the steps. We need to resume() because stream-combiner2
		// seems to pause the stream and it doesn't reach the `end` event
		return combinedStream.resume();
	}
};

module.exports.sass = function(gulp, config) {
	config = config || {};
	var src = config.sass || files.getMainSassPath() || null;
	var cwd = config.cwd || process.cwd();

	if (src) {
		var destFolder = config.buildFolder || files.getBuildFolderPath();
		var dest = config.buildCss || 'main.css';

		log.secondary('Compiling ' + src);

		config.env = config.env || 'development';
		var useSourceMaps = config.sourcemaps === true || config.env === 'development';

		var sassConfig = {
			includePaths: [path.join(cwd, 'bower_components')].concat(config.sassIncludePaths || []),
			outputStyle: config.env === 'production' ? 'compressed' : 'nested'
		};

		var autoprefixerConfig = {
			browsers: config.autoprefixerBrowsers || ['> 1%', 'last 2 versions', 'ie > 6', 'ff ESR'],
			cascade: config.autoprefixerCascade || false,
			remove: config.autoprefixerRemove === undefined ? true : config.autoprefixerRemove
		};

		var combinedStream = combine(
			gulp.src(src),
			gulpif(config.sassPrefix, function() {
				return prefixer(config.sassPrefix);
			}),
			sass(sassConfig),
			gulpif(useSourceMaps, function() {
				return sourcemaps.init({loadMaps: true});
			}),
			autoprefixer(autoprefixerConfig),
			gulpif(config.env === 'production', function() {
				return cleanCss(config.cleanCss || {
					advanced: false
				});
			}),
			gulpif(useSourceMaps, function() {
				return sourcemaps.write();
			}),
			rename(dest),
			gulpif(destFolder !== 'disabled', function() {
				return gulp.dest(destFolder);
			})
		);

		// Returns a combined stream so an error handler can be attached to the end of the pipeline,
		// and it will have effects in all the steps. We need to resume() because stream-combiner2
		// seems to pause the stream and it doesn't reach the `end` event
		return combinedStream.resume();
	}
};

module.exports.watchable = true;
module.exports.description = 'Build module in current directory';
