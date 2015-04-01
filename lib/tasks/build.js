"use strict";

var path = require('path');
var fs = require('fs');
var merge = require('merge-stream');
var BowerPlugin = require('bower-webpack-plugin');
var webpack = require('gulp-webpack');
var streamify = require('gulp-streamify');
var sass = require('gulp-ruby-sass');
var cleanCss = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var gulpif = require('gulp-if');
var autoprefixer = require('gulp-autoprefixer');
var files = require('../helpers/files');
var log = require('../helpers/log');

module.exports = function(gulp, config) {
	var jsStream = module.exports.js(gulp, config);
	var sassStream = module.exports.sass(gulp, config);
	if (jsStream && sassStream) {
		return merge(jsStream, sassStream);
	}
	return jsStream || sassStream;
};

function BowerPlugin() {
	var validPositions[];
	// Hacky way to get main file when bowerConfig.main is an array
	function getMainFilePositions(modulePath) {
		var bowerMain = JSON.parse(fs.readFileSync(path.join(modulePath, 'bower.json'))).main;
		var validFilePositions = [];
		if (Array.isArray(bowerMain)) {
			for (var i = 0; i < bowerMain.length; i++) {
				// Checks if file name ends in '.js'
				if (bowerMain[i].indexOf('.js', bowerMain[i].length - 3) !== -1) {
					validFilePositions.push(['main', i]);
				}
			}
		} else {
			validFilePositions.push(['main', 0]);
		}

		return validFilePositions;
	}

	var validFiles = ['main'].concat(getMainFilePositions());
	return new ResolverPlugin(new ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', validFiles));
}

module.exports.js = function(gulp, config) {
	config = config || {};
	var src = config.js || files.getMainJsPath() || null;
	if (src) {
		var loaders = ['babel-loader'].concat(config.loaders || []);

		config.env = config.env || 'development';

		var useSourceMaps = config.sourcemaps === true || config.env === 'development';

		var destFolder = config.buildFolder || files.getBuildFolderPath();
		var dest = config.buildJs || 'main.js';

		var webpackConfig = {
			resolve: {
				root: [path.join(process.cwd(), 'bower_components')]
			},
			resolveLoader: {
				root: path.join(__dirname, '../../node_modules')
			},
			plugins: [
				BowerPlugin()
			],
			module: {
				loaders: [
					{ test: /\.js$/, exclude: /node_modules/, loaders: loaders}
				]
			},
			output: {
				filename: dest
			},
			devtool: useSourceMaps ? '#source-map' : ''
		};

		log.secondary("Webpacking " + src);

		return gulp.src(src)
			.pipe(webpack(webpackConfig))
			// .pipe(gulpif(config.env === 'production', streamify(uglify())))
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
			.pipe(gulp.dest(destFolder));
	}
};

module.exports.watchable = true;
module.exports.description = 'Build module in current directory';
