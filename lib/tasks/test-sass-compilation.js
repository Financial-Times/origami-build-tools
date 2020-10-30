'use strict';

const files = require('../helpers/files');
const buildSass = require('./build-sass');
const Listr = require('listr');
const ListrRenderer = require('../helpers/listr-renderer');
const isCI = require('is-ci');

async function compilationTest(cwd, { silent, brand } = {
	silent: false,
	brand: false
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
		cwd: cwd,
		sourcemaps: false,
		outputStyle: 'compressed' // to remove sass multiline/loud comments from the css output
	};

	try {
		const css = await buildSass(sassConfig);

		// Error if Sass is or isn't silent, according to the current test.
		return silentSass({silent})(css);
	} catch (error) {
		const errorMessage = `Error when compiling ${brand ? `for brand "${brand}"` : ''} ${silent ? 'with' : 'without'} silent mode: ${error.message}`;
		if (isCI) {
			const newLine = "%0A";
			const message = errorMessage.replace(/\n/g, newLine);
			console.log(`::error file=${mainSassFilePath},line=1,col=1::${message}`);
		}
		throw new Error(errorMessage);
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
						task.title = `Testing compilation with silent mode on`;

						await compilationTest(config.cwd, {
							silent: true
						});

						if (brands.length === 0) {
							task.title = `Testing compilation with silent mode off`;
							await compilationTest(config.cwd, {
								silent: false
							});
						} else {
							for (const brand of brands) {
								task.title = `Testing compilation for the ${brand} brand with silent mode off`;
								await compilationTest(config.cwd, {
									brand,
									silent: false
								});
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
