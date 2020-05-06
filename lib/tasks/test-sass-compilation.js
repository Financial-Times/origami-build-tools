'use strict';

const files = require('../helpers/files');
const nodeSass = require('node-sass');
const buildSass = require('./build-sass');
const Listr = require('listr');
const ListrRenderer = require('../helpers/listr-renderer');

async function compilationTest(cwd, { silent, brand, sassImplementation, ignoreBower} = {
	silent: false,
	brand: false,
	sassImplementation: 'node-sass',
	ignoreBower: false
}) {
	const silentSass = require('../plugins/silent-sass');
	const mainSassFilePath = await files.getMainSassPath(cwd);
	if (!mainSassFilePath) {
		return;
	}
	const sassFiles = await files.getSassFilesList(cwd);
	const supportsSilent = await files.sassSupportsSilent(sassFiles, cwd);
	if (!supportsSilent) {
		return;
	}

	const name = await files.getModuleName();
	const sassVar = '$' + name + '-is-silent: ' + String(Boolean(silent)) + ';';

	const sassConfig = {
		sassPrefix: sassVar,
		sassIncludePaths: [cwd],
		brand: brand,
		buildFolder: 'disabled',
		ignoreBower,
		cwd: cwd,
		sourcemaps: false,
		outputStyle: 'compressed' // to remove sass multiline/loud comments from the css output
	};

	try {
		let css = '';

		const validSassImplementations = ['node-sass', 'dart-sass'];
		if (!validSassImplementations.includes(sassImplementation)) {
			throw new Error(`"sassImplementation" must be one of: ${validSassImplementations}`);
		}

		if (sassImplementation === 'node-sass') {
			const sassData = await buildSass.getSassData(mainSassFilePath, sassConfig);
			const nodeSassConfig = Object.assign(sassConfig, {
				data: sassData,
				includePaths: files.getSassIncludePaths(cwd, sassConfig),
			});
			const nodeSassResult = nodeSass.renderSync(nodeSassConfig);
			css = nodeSassResult.css.toString();
		}

		if (sassImplementation === 'dart-sass') {
			css = await buildSass(sassConfig);
		}

		// Error if Sass is or isn't silent, according to the current test.
		return silentSass({silent})(css);
	} catch (error) {
		throw new Error(`Error when compiling ${brand ? `for brand "${brand}"` : ''} ${silent ? 'with' : 'without'} silent mode: ${error.message}`);
	}
}


module.exports = function (cfg) {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	return {
		title: `Testing sass compilation`,
		task: () => {
			return new Listr([
				{
					title: 'Tests starting...',
					task: async (context, task) => {
						const brands = await files.getModuleBrands();
						for (const sassImplementation of ['node-sass', 'dart-sass']) {
							task.title = `Testing ${sassImplementation} compilation with silent mode on`;

							await compilationTest(config.cwd, {
								sassImplementation,
								silent: true,
								ignoreBower: config.ignoreBower
							});

							if (brands.length === 0) {
								task.title = `Testing ${sassImplementation} compilation with silent mode off`;
								await compilationTest(config.cwd, {
									sassImplementation,
									silent: false,
									ignoreBower: config.ignoreBower
								});
							} else {
								for (const brand of brands) {
									task.title = `Testing ${sassImplementation} compilation for the ${brand} brand with silent mode off`;
									await compilationTest(config.cwd, {
										brand,
										sassImplementation,
										silent: false,
										ignoreBower: config.ignoreBower
									});
								}
							}
						}
					}
				}
			], {
				renderer: ListrRenderer,
				collapse: false,
				showSubtasks: true,
				concurrent: true
			});
		},
		skip: () => !files.getMainSassPath(config.cwd)
	};
};
