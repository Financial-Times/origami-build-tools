'use strict';

const path = require('path');
const fs = require('fs-extra');
const denodeify = require('denodeify');
const readFile = denodeify(fs.readFile);
const outputFile = denodeify(fs.outputFile);
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
const cssnano = require('cssnano');

const ftSass = require('@financial-times/sass');
const execa = require('execa');

const files = require('../helpers/files');

/**
 * Set Sass prefix, e.g. for testing purposes, setting o-assets path.
*/
function getSassData(sassFile, config = {
	brand: undefined,
	sassPrefix: ''
}) {
	// Set Sass system code variable `$system-code`.
	const sassSystemCodeVariable = '$system-code: "origami-build-tools";';
	// Set Sass brand variable `$o-brand`, given as an obt argument.
	const sassBrandVariable = config.brand ? `$o-brand: ${config.brand};` : '';
	const sassPrefix = config.sassPrefix ? config.sassPrefix : '';
	return readFile(sassFile, 'utf-8').then(code =>
		sassSystemCodeVariable + sassBrandVariable + sassPrefix + code
	);
}

module.exports = function buildSass(config) {
	config = config || {};
	const cwd = config.cwd || process.cwd();
	const src = config.sass ? Promise.resolve(config.sass) : files.getMainSassPath(cwd);

	return src.then(sassFile => {
		if (sassFile) {
			const destFolder = config.buildFolder || files.getBuildFolderPath(cwd);
			const dest = config.buildCss || 'main.css';
			const useSourceMaps = config.sourcemaps || !config.production;
			const sassData = getSassData(sassFile, {
				brand: config.brand,
				sassPrefix: config.sassPrefix,
			});

			return Promise.resolve(sassData)
				.then(sassData => {

					const sassArguments = [];
					// Load Sass from standard input
					sassArguments.push('--stdin');
					// Set Sass include paths (i.e. bower and npm paths)
					sassArguments.push(
						...files.getSassIncludePaths(cwd, config).map(p => `--load-path=${p}`)
					);
					// Set CSS output style. Expanded by default
					sassArguments.push(`--style=${config.outputStyle || 'expanded'}`);
					// Configure sourcemaps
					sassArguments.push(...useSourceMaps ?
						['--embed-source-map', '--source-map-urls=absolute'] :
						['--no-source-map'],
					);
					// Only emit warnings or debug notices when in verbose mode
					if (!config.verbose) {
						sassArguments.push('--quiet');
					}
					// Build Sass
					let result = '';
					try {
						result = execa.sync(ftSass, sassArguments, { input: sassData });
					} catch (error) {
						const stderr = error.stderr || '';
						let errorMessage = `Failed building Sass:\n' ${stderr}\n`;
						// Find where the Sass error occurred from stderr.
						const [
							match,
							file,
							line,
							column
						] = stderr.match(/(?:[\s]+)?(.+.scss)(?:[\s]+)([0-9]+):([0-9]+)/);
						// If we know where the Sass error occurred, provide an absolute uri.
						if(match) {
							errorMessage = errorMessage +
								`\n${path.join(cwd, file)}:${line}:${column}\n`;
						}
						// Forward Sass error.
						throw new Error(errorMessage);
					}

					return result.stdout;
				}).then(css => {
					// post css does not parse the charset unless it is also base64.
					// Remove the charset as a workaround, and remove this code
					// when postcss release a fix.
					// https://github.com/postcss/postcss/issues/1281#issuecomment-599626666
					css = css.replace(
						`application/json;charset=utf-8,`,
						`application/json,`
					);

					const postCssTransforms = [];

					// Configure postcss autoprefixer transform
					postCssTransforms.push(autoprefixer({
						browsers: [
							'> 1%',
							'last 2 versions',
							'ie >= 11',
							'ff ESR',
							'safari >= 9'
						],
						cascade: false,
						flexbox: 'no-2009',
						grid: true
					}));

					// Configure postcss cssnano transform for production
					if (config.production) {
						postCssTransforms.push(cssnano({
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

					// Set postcss options
					const postCssOptions = useSourceMaps ? {
						from: sassFile,
						to: dest,
						map: { inline: true }
					} : {};

					// Run postcss
					try {
						return postcss(postCssTransforms).process(css, postCssOptions);
					} catch(error) {
						throw new Error(
							`Failed building Sass: postcss threw an error.\n` +
							error.message
						);
					}
				}).then(postcssResult => {
					let css = postcssResult.css;
					// Return css after writing to file if a destination
					// directory is given.
					if (destFolder !== 'disabled') {
						return outputFile(path.join(destFolder, dest), css).then(() => css);
					}
					// Otherwise just return the css.
					return css;
				});
		}
	});
};

module.exports.getSassData = getSassData;
