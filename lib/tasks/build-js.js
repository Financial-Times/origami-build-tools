'use strict';

const esbuild = require('esbuild');
const path = require('path');
const files = require('../helpers/files');
const fs = require('fs-extra');
const babel = require('@babel/core');

module.exports = async function (cfg) {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	let src;
	if (config.js) {
		src = config.js;
	} else {
		src = await files.getMainJsPath();
	}


	if (src) {
		const builtFileName = config.buildJs ? config.buildJs : "main.js";
		const destFolder = config.buildFolder ? config.buildFolder : files.getBuildFolderPath();

		const esbuildResult = await esbuild.build({
			entryPoints: [src],
			sourcemap: 'inline',
			bundle: true,
			write: false
		});

		const bundle = esbuildResult.outputFiles[0] ? esbuildResult.outputFiles[0].text : '';

		const { code: compiledBundle } = await babel.transform(bundle, {
			configFile: false,
			inputSourceMap: true,
			sourceMaps: 'inline',
			sourceFileName: path.basename(src),
			sourceRoot: path.dirname(src),
			sourceType: 'script'
		});

		await fs.outputFile(path.join(destFolder, builtFileName), compiledBundle, 'utf-8');
		return compiledBundle;
	}
};
