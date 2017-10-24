'use strict';

const path = require('path');
const merge = require('merge-stream');
const BowerResolvePlugin = require('bower-resolve-webpack-plugin');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const combine = require('stream-combiner2');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const cleanCss = require('gulp-clean-css');
const rename = require('gulp-rename');
const gulpif = require('gulp-if-else');
const autoprefixer = require('gulp-autoprefixer');
const prefixer = require('../plugins/gulp-prefixer');
const files = require('../helpers/files');
const log = require('../helpers/log');

module.exports = function(gulp, config) {
	let jsStream;
	let sassStream;
	const buildStream = merge();
	const emitBuildStreamErrorEvent = buildStream.emit.bind(buildStream, 'error');
	if (typeof config.watching === 'undefined' || config.watching === 'js') {
		jsStream = module.exports.js(gulp, config);

		if (typeof jsStream !== 'undefined') {
			jsStream.on('error', emitBuildStreamErrorEvent);
		}
	}
	if (typeof config.watching === 'undefined' || config.watching === 'sass') {
		sassStream = module.exports.sass(gulp, config);

		if (typeof sassStream !== 'undefined') {
			sassStream.on('error', emitBuildStreamErrorEvent);
		}
	}
	if (jsStream && sassStream) {
		buildStream.add(jsStream, sassStream);
		return buildStream;
	}
	return jsStream || sassStream;
};

module.exports.js = function(gulp, config) {
	config = config || {};
	const src = config.js || files.getMainJsPath() || null;
	const cwd = config.cwd || process.cwd();

	if (src) {
		// Temporary fix as aliased loaders don't pass in queries due to webpack bug
		const textrequireifyPath = path.join(__dirname, '../plugins/textrequireify-loader.js');

		// They're loaded right to left
		const loaders = [
			{
				loader: textrequireifyPath,
				options: {
					cwd: cwd
				}
			},
			// Makes paths to babel-runtime polyfills absolute as they're
			// in OBT's node_modules directory and not the module's
			{
				loader: 'babel-runtime-path-loader',
			},
			{
				loader: 'babel-loader',
				options: {
					// TODO: Look into using preset-env instead and specifying our minimum versions
					// for enhanced experience instead of making everything become ES5
					presets: [
						require.resolve('babel-preset-es3'),
						require.resolve('babel-preset-es2015'),
						require.resolve('babel-preset-es2016'),
						require.resolve('babel-preset-es2017')
					],
					plugins: [
						require.resolve('babel-plugin-add-module-exports'),
						// Polyfills the runtime needed for async/await and generators
						// Useful for applications rather than components.
						require.resolve('babel-plugin-transform-runtime')
					]
				}
			},
			// Disables AMD module loading
			'imports-loader?define=>false'
		].concat(config.loaders || []);

		config.env = config.env || 'development';

		const useSourceMaps = config.sourcemaps || (config.env === 'development');

		const destFolder = config.buildFolder || files.getBuildFolderPath();
		const dest = config.buildJs || 'main.js';


		log.secondary('Webpacking ' + src);

		const plugins = [new webpack.LoaderOptionsPlugin({
			options: {
				quiet: true
			}
		})];

		if (config.env === 'production') {
			plugins.push(new webpack.optimize.UglifyJsPlugin({
				sourceMap: useSourceMaps
			}));
			plugins.push(new webpack.DefinePlugin({ 'process.env': { 'NODE_ENV': '"production"' } }));
		}
		const webpackConfig = {
			resolve: {
				// This will handle a bower.json's `main` property being an array.
				plugins: [new BowerResolvePlugin()],
				// In which folders the resolver look for modules
				// relative paths are looked up in every parent folder (like node_modules)
				// absolute paths are looked up directly
				// the order is respected
				modules: ['bower_components', 'node_modules'],
				// These JSON files are read in directories
				descriptionFiles: ['bower.json', 'package.json'],
				// These fields in the description files are looked up when trying to resolve the package directory
				mainFields: ['browser', 'main'],
				// These files are tried when trying to resolve a directory
				mainFiles: ['index', 'main'],
				// These extensions are tried when resolving a file
				extensions: ['.js', '.json']
			},
			resolveLoader: {
				modules: [
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
				rules: [
					{
						test: /\.js$/,
						exclude: /node_modules/,
						use: loaders
					},
					// Node.JS, require.js and Browserify support requiring JSON files
					// json-loader does this in webpack
					{
						test: /\.json$/,
						loader: 'json-loader'
					},
					{
						test: /\.html$/,
						loader: 'raw-loader'
					},
					{
						test: /\.txt$/,
						loader: 'raw-loader'
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
			webpackStream(webpackConfig, webpack),
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
			browsers: config.autoprefixerBrowsers || ['> 1%', 'last 2 versions', 'ie > 6', 'ff ESR', 'bb >= 7', 'safari >= 8'],
			cascade: config.autoprefixerCascade || false,
			flexbox: 'no-2009',
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
					advanced: false,
					compatibility: 'ie8'
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
