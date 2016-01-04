'use strict';

const path = require('path');
const merge = require('merge-stream');
const BowerPlugin = require('bower-webpack-plugin');
const webpack = require('webpack-stream');
const combine = require('stream-combiner2');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const cleanCss = require('gulp-minify-css');
const rename = require('gulp-rename');
const gulpif = require('gulp-if-else');
const autoprefixer = require('gulp-autoprefixer');
const prefixer = require('../plugins/gulp-prefixer');
const files = require('../helpers/files');
const log = require('../helpers/log');

module.exports = function(gulp, config) {
	let jsStream;
	let sassStream;
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
	const src = config.js || files.getMainJsPath() || null;
	const cwd = config.cwd || process.cwd();
	const babelRuntime = config.babelRuntime || true;

	if (src) {
		// Temporary fix as aliased loaders don't pass in queries due to webpack bug
		const textrequireifyPath = path.join(__dirname, '../plugins/textrequireify-loader.js');

		// They're loaded right to left
		const loaders = [
			textrequireifyPath + '?cwd=' + cwd,
			// Makes paths to babel-runtime polyfills absolute as they're
			// in OBT's node_modules directory and not the module's
			'babel-runtime-path-loader',
			babelRuntime ? 'babel?optional[]=runtime' : '',
			// Disables AMD module loading
			'imports?define=>false'
		].concat(config.loaders || []);

		config.env = config.env || 'development';

		const useSourceMaps = config.sourcemaps || (config.env === 'development');

		const destFolder = config.buildFolder || files.getBuildFolderPath();
		const dest = config.buildJs || 'main.js';

		const bowerPlugin = new BowerPlugin({
			includes: /\.js$/
		});

		// Since (currently) no custom module directories are defined, rely on BowerPlugin dir resolution.
		const moduleDirectories = bowerPlugin.modulesDirectories.map((moduleDirectory) => {
			return path.join(cwd, moduleDirectory);
		});

		log.secondary('Webpacking ' + src);

		const plugins = [bowerPlugin];

		if (config.env === 'production') {
			plugins.push(new webpack.webpack.optimize.UglifyJsPlugin({
				sourceMap: useSourceMaps
			}))
		}
		const webpackConfig = {
			quiet: true,
			resolve: {
				root: moduleDirectories
			},
			resolveLoader: {
				root: [
					path.join(__dirname, '../../node_modules'),
					path.join(process.cwd(), './node_modules')
				],
				alias: {
					'babel-runtime-path-loader': path.join(__dirname, '../plugins/babelRuntimePathResolver'),
					'textrequireify-loader': path.join(__dirname, '../plugins/textrequireify-loader')
				}
			},
			plugins: plugins,
			module: {
				loaders: [
					{
						test: /\.js$/,
						exclude: /node_modules/,
						loaders: loaders
					},
					// Node.JS, require.js and Browserify support requiring JSON files
					// json-loader does this in webpack
					{
						test: /\.json$/,
						loader: 'json'
					}
				]
			},
			devtool: useSourceMaps ? (useSourceMaps === 'inline' ? 'inline-source-map' : 'source-map') : undefined,
			output: {
				devtoolModuleFilenameTemplate: '[resource-path]',
				filename: dest,
				sourceMapFilename: dest + '.map'
			}
		};

		if (config.standalone) {
			webpackConfig.output.library = config.standalone;
		}

		const combinedStream = combine.obj(
			gulp.src(src),
			webpack(webpackConfig),
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

module.exports.sass = function(gulp, config) {
	config = config || {};
	const src = config.sass || files.getMainSassPath() || null;
	const cwd = config.cwd || process.cwd();

	if (src) {
		const destFolder = config.buildFolder || files.getBuildFolderPath();
		const dest = config.buildCss || 'main.css';

		log.secondary('Compiling ' + src);

		config.env = config.env || 'development';
		const useSourceMaps = config.sourcemaps || (config.env === 'development');

		const sassConfig = {
			includePaths: [path.join(cwd, 'bower_components')].concat(config.sassIncludePaths || []),
			outputStyle: 'nested'
		};

		const autoprefixerConfig = {
			browsers: config.autoprefixerBrowsers || ['> 1%', 'last 2 versions', 'ie > 6', 'ff ESR', 'bb >= 7'],
			cascade: config.autoprefixerCascade || false,
			remove: config.autoprefixerRemove === undefined ? true : config.autoprefixerRemove
		};

		const combinedStream = combine.obj(
			gulp.src(src),
			gulpif(config.sassPrefix, function() {
				return prefixer(config.sassPrefix);
			}),
			gulpif(useSourceMaps, function() {
				return sourcemaps.init();
			}),
			sass(sassConfig),
			autoprefixer(autoprefixerConfig),
			gulpif(config.env === 'production', function() {
				return cleanCss(config.cleanCss || {
					advanced: false
				});
			}),
			gulpif(useSourceMaps, function() {
				if (useSourceMaps === 'inline') {
					return sourcemaps.write();
				} else {
					return sourcemaps.write('./', { sourceMappingURL: () => `${dest}.map` });
				}
			}),
			rename(path => {
				if (path.extname !== '.map') {
					path.extname = '';
				}
				path.basename = dest;
			}),
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
