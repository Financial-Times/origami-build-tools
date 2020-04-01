'use strict';

const oaxPath = require('oax');
const path = require('path');

const files = require('../helpers/files');
const {run} = require('../helpers/command-line');
const fs = require('fs-extra');

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
		const oaxArguments = [];
		oaxArguments.push(`--input`);
		oaxArguments.push(src);
		if (!config.ignoreBower) {
			oaxArguments.push(`--for-bower`);
		}
		const builtFileName = config.buildJs ? config.buildJs : "main.js";

		const destFolder = config.buildFolder ? config.buildFolder : files.getBuildFolderPath();

		const oax = run(oaxPath, oaxArguments, {
			stdout: false,
			stderr: false
		});

		const includeSourceMaps = config.production ? false : true;

		const swcArguments = ['--filename', '-', '--no-swcrc', '-C', 'minify'];
		if (includeSourceMaps ) {
			swcArguments.push('--source-maps', 'inline');
		}

		const swc = run('swc', swcArguments, {
			stdout: false,
			stderr: false
		});

		oax.stdout.pipe(swc.stdin);
		const {stdout: compiledBundle} = await swc;
		await fs.outputFile(path.join(destFolder, builtFileName), compiledBundle, 'utf-8');
		return compiledBundle;

	}
};
