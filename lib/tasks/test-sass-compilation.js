'use strict';

const files = require('../helpers/files');

function compilationTest(cwd, { silent, brand } = {
	silent: false,
	brand: false
}) {
	const sass = require('./build-sass');
	const silentSass = require('../plugins/silent-sass');
	const nodeSass = require('node-sass');
	return files.getMainSassPath(cwd)
		.then(mainSassFile => {
			if (mainSassFile) {
				return files.getSassFilesList(cwd)
					.then(sassFiles => {
						return files.sassSupportsSilent(sassFiles, cwd)
							.then(supportsSilent => {
								if (supportsSilent) {
									return files.getBowerJson(cwd)
										.then(bowerJson => {
											const sassVar = '$' + (bowerJson || {}).name + '-is-silent: ' + String(Boolean(silent)) + ';';

											const sassConfig = {
												sassPrefix: sassVar,
												sassIncludePaths: [cwd],
												production: true,
												brand: brand,
												buildFolder: 'disabled',
												sassFunctions: {
													'@warn': function () {
														return nodeSass.NULL;
													}
												},
												cwd: cwd
											};

											return sass(sassConfig)
												.then(css => {
													css = String(css);
													return silentSass({
														silent: silent
													})(css);
												})
												.catch((error) => {
													throw new Error(`Error when compiling ${brand ? `for brand "${brand}"` : ''} ${silent ? 'with' : 'without'} silent mode: ${error.message}`);
												});
										});
								}
							});
					});
			}
		});
}


module.exports = function (cfg) {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	return files.getModuleBrands().then((brands) => {

		const silientModeTest = {
			title: 'Testing SCSS compilation with silent mode on',
			task: () => compilationTest(config.cwd, { silent: true }),
			skip: () => !files.getMainSassPath(config.cwd)
		};

		if (brands.length === 0) {
			return [silientModeTest, {
				title: 'Testing SCSS compilation with silent mode off',
				task: () => compilationTest(config.cwd, { silent: false }),
				skip: () => !files.getMainSassPath(config.cwd)
			}];
		}

		return [silientModeTest, ...brands.map(brand => {
			return {
				title: `Testing SCSS compilation for the ${brand} brand`,
				task: () => compilationTest(config.cwd, {
					brand,
					silent: false
				}),
				skip: () => !files.getMainSassPath(config.cwd)
			};
		})];
	});
};
