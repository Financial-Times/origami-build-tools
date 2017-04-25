'use strict';

module.exports = function (gulp, config) {
	const merge = require('merge-stream');
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

module.exports.js = function (gulp, config = { flags: {}}) {
	const files = require('../helpers/files');
	const src = config.flags.js ? config.flags.js : files.getMainJsPath();

	if (src) {
		const combine = require('stream-combiner2');
		const log = require('../helpers/log');

		const webpack = require('webpack-stream');
		const wp = require('webpack');

		const webpackConfig = (config.flags.production) ? require('../../config/webpack.config.prod') : require('../../config/webpack.config.dev');

		if (config.flags.buildJs) {
			webpackConfig.output.filename = config.flags.buildJs;
		} else {
			webpackConfig.output.filename = 'main.js';
		}

		if (config.flags.standalone) {
			webpackConfig.output.library = config.flags.standalone;
		}

		const destFolder = config.flags.buildFolder ? config.flags.buildFolder : files.getBuildFolderPath();

		log.secondary('Webpacking ' + src);

		const combinedStream = combine.obj(
			gulp.src(src),
			webpack(webpackConfig, wp),
			gulp.dest(destFolder)
		);

		// Returns a combined stream so an error handler can be attached to the end of the pipeline,
		// and it will have effects in all the steps. We need to resume() because stream-combiner2
		// seems to pause the stream and it doesn't reach the `end` event
		return combinedStream.resume();
	}
};

module.exports.sass = function (config) {
	const path = require('path');

	const fs = require('fs-extra');
	const denodeify = require('denodeify');
	const readFile = denodeify(fs.readFile);
	const outputFile = denodeify(fs.outputFile);
	const streamFromPromise = require('stream-from-promise');
	const autoprefixer = require('autoprefixer');
	const postcss = require('postcss');
	const cssnano = require('cssnano');
	const sass = denodeify(require('node-sass').render);

	const files = require('../helpers/files');
	config = config || {};
	const src = config.sass || files.getMainSassPath() || null;
	const cwd = config.cwd || process.cwd();

	if (src) {
		const destFolder = config.buildFolder || files.getBuildFolderPath();
		const dest = config.buildCss || 'main.css';

		config.env = config.env || 'development';

		// TODO: If we want to enable sourcemaps to be externalised, we need to use excorsist
		// This use case is not needed by OBS but might be useful for web-apps and for Registry demos.
		// It would look something like this:
		// return new Promise((resolve, reject) => {
		// 		stringToStream(result.css)
		// 			.on('error', reject)
		// 			.pipe(exorcist(concatStream(resolve), 'foobar'))
		// 			.on('error', reject);
		// 		})
		const useSourceMaps = config.sourcemaps || (config.env === 'development');

		const autoprefixerConfig = {
			browsers: config.autoprefixerBrowsers || ['> 1%', 'last 2 versions', 'ie > 6', 'ff ESR', 'bb >= 7', 'safari >= 8'],
			cascade: config.autoprefixerCascade || false,
			flexbox: 'no-2009',
			remove: config.autoprefixerRemove === undefined ? true : config.autoprefixerRemove
		};


		return streamFromPromise(readFile(src, 'utf-8')
			.then(sassFile => {

				// Sass prefixing is used in our origami component specification sass tests
				if (config.sassPrefix) {
					sassFile = config.sassPrefix + sassFile;
				}

				const includePaths = (config.sassIncludePaths || []).concat('bower_components').map(p => path.join(cwd, p));
				const sassConfig = {
					data: sassFile,
					includePaths,
					outputStyle: 'nested',

					// This is an experimental LibSass feature. Use with caution.
					// https://github.com/sass/node-sass#functions--v300---experimental
					// We use this to silence the sass console output when running `obt test`
					functions: config.sassFunctions ? config.sassFunctions : {},
				};

				if (useSourceMaps) {
					sassConfig.sourceMap = src;
					sassConfig.outFile = dest;

					// Embeds the source map as a data URI
					sassConfig.sourceMapEmbed = true;
				}

				const postCssTransforms = [];
				postCssTransforms.push(autoprefixer(autoprefixerConfig));
				if (config.env === 'production') {
					postCssTransforms.push(cssnano({
						colormin: {
							// Enable IE < 10 compatibility;
							// IE < 10 chokes on the transparent keyword
							// in this mode the conversion from rgba(0,0,0,0) is turned off.
							legacy: true
						},
						// Trims whitespace inside and around rules, selectors & declarations, plus removes the final semicolon inside every selector.
						// Turn this on to improve minified css size.
						core: true,
						// Disable advanced optimisations that are not always safe.
						// This disables custom identifier reduction, z-index rebasing,
						// unused at- rule removal & conversion between absolute length values.
						safe: true,
						// Generate an inline source map.
						sourcemap: useSourceMaps ? true : false
					}));
				}

				return sass(sassConfig)
					.then((result) => {
						if (useSourceMaps) {
							return postcss(postCssTransforms).process(result.css, {
								from: src,
								to: dest,
								map: {
									inline: true
								}
							});
						} else {
							return postcss(postCssTransforms).process(result.css);
						}
					})
					.then(result => {
						if (destFolder !== 'disabled') {
							return outputFile(path.join(destFolder, dest), result.css);
						} else {
							return result.css;
						}
					});
			}))
			// Forcing the stream to start reading even though there are no consumers of the stream.
			// This usually means the stream has side-effects such as writing to a file-system.
			// Jake: I don't like that this needs to happen
			// Perhaps we should have another module which handles all the compiling of sass etc
			// And this module deals with where to write that compiled css stream to.
			.resume();
	}
};

module.exports.watchable = true;
