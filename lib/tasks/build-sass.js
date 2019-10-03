'use strict';

const path = require('path');
const fs = require('fs-extra');
const denodeify = require('denodeify');
const readFile = denodeify(fs.readFile);
const outputFile = denodeify(fs.outputFile);
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
const cssnano = require('cssnano');
const nodeSass = require('node-sass');
const files = require('../helpers/files');

module.exports = function buildSass(config) {
	config = config || {};
	const sass = config.sassLibrary || nodeSass;
	const sassRender = denodeify(sass.render);
	const cwd = config.cwd || process.cwd();
	const src = config.sass ? Promise.resolve(config.sass) : files.getMainSassPath(cwd);

	return src.then(sassFile => {
		if (sassFile) {
			const destFolder = config.buildFolder || files.getBuildFolderPath(cwd);
			const dest = config.buildCss || 'main.css';

			// TODO: If we want to enable sourcemaps to be externalised, we need to use excorsist
			// This use case is not needed by OBS but might be useful for web-apps and for Registry demos.
			// It would look something like this:
			// return new Promise((resolve, reject) => {
			// 		stringToStream(result.css)
			// 			.on('error', reject)
			// 			.pipe(exorcist(concatStream(resolve), 'foobar'))
			// 			.on('error', reject);
			// 		})
			const useSourceMaps = config.sourcemaps || !config.production;

			const autoprefixerConfig = {
				browsers: config.autoprefixerBrowsers || ['> 1%', 'last 2 versions', 'ie > 6', 'ff ESR', 'bb >= 7', 'safari >= 8'],
				cascade: config.autoprefixerCascade || false,
				flexbox: 'no-2009',
				remove: config.autoprefixerRemove === undefined ? true : config.autoprefixerRemove,
				grid: true
			};

			// Set Sass prefix, e.g. for testing purposes, setting o-assets path.
			const sassPrefix = config.sassPrefix || '';
			// Set Sass system code variable `$system-code`.
			const sassSystemCodeVariable = '$system-code: "origami-build-tools";';
			// Set Sass brand variable `$o-brand`, given as an obt argument.
			const sassBrandVariable = config.brand ? `$o-brand: ${config.brand};` : '';
			const sassConfig = readFile(sassFile, 'utf-8').then(code => {
				return { data: sassSystemCodeVariable + sassBrandVariable + sassPrefix + code };
			});

			return Promise.resolve(sassConfig)
				.then(sassConfig => {
					const includePaths = files.getSassIncludePaths(cwd, config);

					sassConfig.includePaths = includePaths;
					sassConfig.outputStyle = config.outputStyle || 'nested';
					// This is an experimental LibSass feature. Use with caution.
					// https://github.com/sass/node-sass#functions--v300---experimental
					// We use this to silence the sass console output when running `obt test`.
					// We also use this to hide warnings when building sass without the verbose flag.
					sassConfig.functions = config.sassFunctions ? config.sassFunctions : {};

					if (useSourceMaps) {
						sassConfig.sourceMap = sassFile;
						sassConfig.outFile = dest;

						// Embeds the source map as a data URI
						sassConfig.sourceMapEmbed = true;
					}

					const postCssTransforms = [];
					postCssTransforms.push(autoprefixer(autoprefixerConfig));

					if (config.production) {
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

					return sassRender(sassConfig)
						.then(({ css }) => {
							if (useSourceMaps) {
								return postcss(postCssTransforms).process(css, {
									from: sassFile,
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
						})
						.catch((error) => {
							throw new Error(
								'Failed building SASS:\n' +
								`${error.formatted || error.message}\n` +
								`${error.file}:${error.line}:${error.column}`
							);
						});
				});
		}
	});
};
