'use strict';

const path = require('path');
const fs = require('fs-extra');
const denodeify = require('denodeify');
const readFile = denodeify(fs.readFile);
const outputFile = denodeify(fs.outputFile);
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
const cssnano = require('cssnano');
const sass = denodeify(require('node-sass').render);
const files = require('../helpers/files');

module.exports = function buildSass(config) {
	config = config || {};
	const src = config.sass ? Promise.resolve(config.sass) : files.getMainSassPath();
	const cwd = config.cwd || process.cwd();

	return src.then(code => {
		if (code) {
			const destFolder = config.buildFolder || files.getBuildFolderPath();
			const dest = config.buildCss || 'main.css';

			config.flags = config.flags || {};

			// TODO: If we want to enable sourcemaps to be externalised, we need to use excorsist
			// This use case is not needed by OBS but might be useful for web-apps and for Registry demos.
			// It would look something like this:
			// return new Promise((resolve, reject) => {
			// 		stringToStream(result.css)
			// 			.on('error', reject)
			// 			.pipe(exorcist(concatStream(resolve), 'foobar'))
			// 			.on('error', reject);
			// 		})
			const useSourceMaps = config.sourcemaps || !config.flags.production;

			const autoprefixerConfig = {
				browsers: config.autoprefixerBrowsers || ['> 1%', 'last 2 versions', 'ie > 6', 'ff ESR', 'bb >= 7', 'safari >= 8'],
				cascade: config.autoprefixerCascade || false,
				flexbox: 'no-2009',
				remove: config.autoprefixerRemove === undefined ? true : config.autoprefixerRemove
			};


			return readFile(code, 'utf-8')
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
						sassConfig.sourceMap = code;
						sassConfig.outFile = dest;

						// Embeds the source map as a data URI
						sassConfig.sourceMapEmbed = true;
					}

					const postCssTransforms = [];
					postCssTransforms.push(autoprefixer(autoprefixerConfig));
					console.log('config.flags.production', config.flags.production);

					if (config.flags && config.flags.production) {
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
						.then(({ css }) => {
							if (useSourceMaps) {
								return postcss(postCssTransforms).process(css, {
									from: code,
									to: dest,
									map: {
										inline: true
									}
								});
							} else {
								return postcss(postCssTransforms).process(css);
							}
						})
						.then(({ css }) => {
							if (destFolder !== 'disabled') {
								return outputFile(path.join(destFolder, dest), css)
									.then(() => css);
							} else {
								return css;
							}
						});
				});
		}
	});
};
