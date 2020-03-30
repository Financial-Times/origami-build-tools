'use strict';

const execa = require('execa');
const oaxPath = require('oax');
const path = require('path');

const files = require('../helpers/files');

module.exports = function (cfg) {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	let src;
	if (config.js) {
		src = Promise.resolve(config.js);
	} else {
		src = files.getMainJsPath();
	}

	return src.then(async code => {
		if (code) {
			const oaxArguments = [];
			oaxArguments.push(`--input ${code}`);
			if (!config.ignoreBower) {
				oaxArguments.push(`--for-bower`);
			}
			const builtFileName = config && config.buildJs ? config.buildJs : "main.js";

			const destFolder = config && config.buildFolder ? config.buildFolder : files.getBuildFolderPath();

			oaxArguments.push(`--output ${path.join(destFolder, builtFileName)}`);
			const oaxCommand = oaxPath + ' ' + oaxArguments.join(' ');
			const {stdout} = await execa.command(oaxCommand);
			return stdout;
		}
	});
};
