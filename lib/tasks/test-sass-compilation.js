'use strict';

const files = require('../helpers/files');
const nodeSass = require('node-sass');
const dartSass = require('sass');

function compilationTest(cwd, { silent, brand, sassLibrary, ignoreBower} = {
	silent: false,
	brand: false,
	sassLibrary: nodeSass,
	ignoreBower: false
}) {
	const buildSass = require('./build-sass');
	const silentSass = require('../plugins/silent-sass');
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
												outputStyle: 'expanded',
												buildFolder: 'disabled',
												sassLibrary,
												ignoreBower,
												cwd: cwd
											};

											return buildSass(sassConfig)
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
		return [{
			name: 'node-sass',
			sassLibrary: nodeSass
		}, {
			name: 'dart-sass',
			sassLibrary: dartSass
		}].reduce((sassTests, sassObject) => {
			const sassLibrary = sassObject.sassLibrary;
			const name = sassObject.name;
			sassTests.push({
				title: `Testing ${name} compilation with silent mode on`,
				task: () => compilationTest(config.cwd, {
					sassLibrary,
					silent: true,
					ignoreBower: config.ignoreBower
				}),
				skip: () => !files.getMainSassPath(config.cwd)
			});

			if (brands.length === 0) {
				sassTests.push({
					title: `Testing ${name} compilation with silent mode off`,
					task: () => compilationTest(config.cwd, {
						sassLibrary,
						silent: false,
						ignoreBower: config.ignoreBower
					}),
					skip: () => !files.getMainSassPath(config.cwd)
				});
			}

			if (brands.length > 0) {
				sassTests.push(...brands.map(brand => {
					return {
						title: `Testing ${name} compilation for the ${brand} brand with silent mode off`,
						task: () => compilationTest(config.cwd, {
							brand,
							sassLibrary,
							silent: false,
							ignoreBower: config.ignoreBower
						}),
						skip: () => !files.getMainSassPath(config.cwd)
					};
				}));
			}

			return sassTests;
		}, []);
	});
};
