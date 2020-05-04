'use strict';

const oaxPath = require('oax');
const path = require('path');

const files = require('../helpers/files');
const {run} = require('../helpers/command-line');
const fs = require('fs-extra');

const dontOutputToTerminal = {
	stdout: false,
	stderr: false
};

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

		const oax = run(oaxPath, oaxArguments, dontOutputToTerminal);

		const swcArguments = ['--filename', '-', '--no-swcrc', '-C', 'minify', '--source-maps', 'inline'];

		const swc = run('swc', swcArguments, Object.assign({
			localDir: path.resolve(__dirname, '../../node_modules/.bin')
		}, dontOutputToTerminal));

		oax.stdout.pipe(swc.stdin);
		const {stdout: compiledBundle} = await swc;
		await fs.outputFile(path.join(destFolder, builtFileName), compiledBundle, 'utf-8');
		return compiledBundle;

	}
};
