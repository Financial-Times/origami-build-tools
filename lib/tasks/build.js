'use strict';

const path = require('path');
const merge = require('merge-stream');
const webpack = require('webpack-stream');
const wp = require('webpack');
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
const through = require('through2');

// Lines 136-150 require these modules
// const ManifestPlugin = require('webpack-manifest-plugin');
// const Md5HashPlugin = require('webpack-md5-hash');

module.exports = function (gulp, config) {
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

module.exports.js = function (gulp, config) {
	config = config || {};
	const src = config.js || files.getMainJsPath() || null;
	const cwd = config.cwd || process.cwd();

	if (src) {
		// Temporary fix as aliased loaders don't pass in queries due to webpack bug
		const textrequireifyPath = path.join(__dirname, '../plugins/textrequireify-loader.js');

		// They're loaded right to left
		const loaders = [
			textrequireifyPath + '?cwd=' + cwd,
			// Disables AMD module loading
			'imports-loader?define=>false'
		].concat(config.loaders || []);

		config.env = config.env || 'development';

		const useSourceMaps = config.sourcemaps || (config.env === 'development');

		const destFolder = config.buildFolder || files.getBuildFolderPath();
		const dest = config.buildJs || 'main.js';

		log.secondary('Webpacking ' + src);

		const webpackConfig = {
			bail: true,
			resolve: {
				// In which folders the resolver look for modules
				// relative paths are looked up in every parent folder (like node_modules)
				// absolute paths are looked up directly
				// the order is respected
				modules: ['node_modules', 'bower_components'],

				// These JSON files are read in directories
				descriptionFiles: ['package.json', 'bower.json'],

				// These fields in the description files are looked up when trying to resolve the package directory
				mainFields: ['main', 'browser'],

				// These files are tried when trying to resolve a directory
				mainFiles: ['index', 'main'],

				// These fields in the description files offer aliasing in this package
				// The content of these fields is an object where requests to a key are mapped to the corresponding value
				aliasFields: ['browser'],

				// These extensions are tried when resolving a file
				extensions: ['.js', '.json'],
			},
			// Resolve loaders (webpack plugins) from the
  		// directory of `OBT` itself rather than the project directory.
			resolveLoader: {
				modules: [
					path.resolve(__dirname, "../../node_modules"),
					'node_modules',
					'bower_components'
				],
				alias: Object.assign({
					'textrequireify-loader': path.join(__dirname, '../plugins/textrequireify-loader')
				})
			},
			plugins: config.env === 'production' ? [
				// Makes some environment variables available to the JS code, for example:
				// if (process.env.NODE_ENV === 'production') { ... }.
				// It is important that NODE_ENV is set to production here.
				// Otherwise libraries such as React will be compiled in development mode.
				new wp.DefinePlugin({
					'process.env.NODE_ENV': JSON.stringify('production')
				}),
				// Minify code, IE8 is core experience, by setting the screw_ie8 option
				// we can use some newer minification techniques.
				new wp.optimize.UglifyJsPlugin({
					compress: {
						screw_ie8: true,
						warnings: false,
					},
					mangle: {
						screw_ie8: true,
					},
					output: {
						comments: false,
						screw_ie8: true,
					},
					sourceMap: useSourceMaps,
				}),

				// TODO: Discuss this with team, should it be enabled? It is useful for applications, not for components.
				// Generate a manifest file which contains a mapping of all asset filenames
				// to their corresponding output file so that tools can pick it up without
				// having to parse `index.html`.
				// new ManifestPlugin({
				// 	fileName: 'asset-manifest.json',
				// }),
				// The MD5 Hash plugin seems to make [chunkhash] for .js files behave
        // like [contenthash] does for extracted .css files, which is essential
        // for deterministic hashing.
        // new Md5HashPlugin(),
        // The Webpack manifest is normally folded into the last chunk, changing
        // its hash - prevent this by extracting the manifest into its own
        // chunk - also essential for deterministic hashing.
        // new wp.optimize.CommonsChunkPlugin({ name: 'manifest', filename: 'manifest.bundle.js' }),


				// Generate stable module ids instead of having Webpack assign integers.
        // HashedModuleIdsPlugin (vendored from Webpack 2) does this without
        // adding too much to bundle size and NamedModulesPlugin allows for
        // easier debugging of development builds.
				new wp.HashedModuleIdsPlugin(),
			] : [new wp.NamedModulesPlugin()],
			module: {
				rules: [
					// Disable require.ensure as it's not a standard language feature.
					{ parser: { requireEnsure: false } },
					// Process JS with Babel.
					{
						test: /\.js$/,
						exclude: /node_modules/,
						use: loaders.concat([
							{
								loader: 'babel-loader',
								options: {

									// TODO: Look into using preset-env instead and specifying our minimum versions
									// for enhanced experience instead of making everything become ES5
									presets: [
										require.resolve('babel-preset-es2015')
									],
									plugins: [
										// Polyfills the runtime needed for async/await and generators
										// Useful for applications rather than components.
										[
											require.resolve('babel-plugin-transform-runtime'),
											{
												helpers: false,
												polyfill: false,
												regenerator: true,
												// Resolve the Babel runtime relative to the config.
												moduleName: path.dirname(require.resolve('babel-runtime/package')),
											},
										],
									],
							}
						}])
					},

					// TODO: Look into which components (if any) are importing html files into their JS.
					{
						test: /\.html$/,
						use: 'raw-loader'
					}
				]
			},
			devtool: useSourceMaps ? (useSourceMaps === 'inline' ? 'inline-source-map' : 'source-map') : undefined,
			output: {
				devtoolModuleFilenameTemplate: '[resource-path]',
				filename: dest,
				// There will be one main bundle, and one file per asynchronous chunk.
				// We don't currently advertise code splitting but Webpack supports it.
				// filename: path.join(dest, '[name].[chunkhash:8].js'),
				// chunkFilename: path.join(dest, 'static/js/[name].[chunkhash:8].chunk.js'),
				sourceMapFilename: dest + '.map'
			},
			// Some libraries import Node modules but don't use them in the browser.
			// Tell Webpack to provide empty mocks for them so importing them works.
			node: {
				fs: 'empty',
				net: 'empty',
				tls: 'empty',
			}
		};

		if (config.standalone) {
			webpackConfig.output.library = config.standalone;
		}

		const combinedStream = combine.obj(
			gulp.src(src),
			webpack(webpackConfig, wp),
			gulpif(useSourceMaps, function () {
				return sourcemaps.init();
			}),
			through.obj(function (file, enc, cb) {
				// Dont pipe through any source map files as it will be handled
				// by gulp-sourcemaps
				const isSourceMap = /\.map$/.test(file.path);
				if (!isSourceMap) this.push(file);
				cb();
			}),
			gulpif(useSourceMaps, function () {
				if (useSourceMaps === 'inline') {
					return sourcemaps.write();
				} else {
					return sourcemaps.write('./', {
						sourceMappingURL: () => `${dest}.map`
					});
				}
			}),
			rename(path => {
				if (path.extname !== '.map') {
					path.extname = '';
				}
				path.basename = dest;
			}),
			gulpif(destFolder !== 'disabled', function () {
				return gulp.dest(destFolder);
			})
		);

		// Returns a combined stream so an error handler can be attached to the end of the pipeline,
		// and it will have effects in all the steps. We need to resume() because stream-combiner2
		// seems to pause the stream and it doesn't reach the `end` event
		return combinedStream.resume();
	}
};

module.exports.sass = function (gulp, config) {
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
			flexbox: 'no-2009',
			remove: config.autoprefixerRemove === undefined ? true : config.autoprefixerRemove
		};

		const combinedStream = combine.obj(
			gulp.src(src),
			gulpif(config.sassPrefix, function () {
				return prefixer(config.sassPrefix);
			}),
			gulpif(useSourceMaps, function () {
				return sourcemaps.init();
			}),
			sass(sassConfig),
			autoprefixer(autoprefixerConfig),
			gulpif(config.env === 'production', function () {
				return cleanCss(config.cleanCss || {
					advanced: false,
					compatibility: 'ie8'
				});
			}),
			gulpif(useSourceMaps, function () {
				if (useSourceMaps === 'inline') {
					return sourcemaps.write();
				} else {
					return sourcemaps.write('./', {
						sourceMappingURL: () => `${dest}.map`
					});
				}
			}),
			rename(path => {
				if (path.extname !== '.map') {
					path.extname = '';
				}
				path.basename = dest;
			}),
			gulpif(destFolder !== 'disabled', function () {
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
