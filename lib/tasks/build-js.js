'use strict';

const execa = require('execa');
const oaxPath = require('oax');
const path = require('path');

const files = require('../helpers/files');
const swc = require("@swc/core");

module.exports = async function (cfg) {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	let src;
	if (config.js) {
		src = await Promise.resolve(config.js);
	} else {
		src = files.getMainJsPath();
	}


	if (src) {
		const oaxArguments = [];
		oaxArguments.push(`--input ${src}`);
		if (!config.ignoreBower) {
			oaxArguments.push(`--for-bower`);
		}
		const builtFileName = config.buildJs ? config.buildJs : "main.js";

		const destFolder = config.buildFolder ? config.buildFolder : files.getBuildFolderPath();

		oaxArguments.push(`--output ${path.join(destFolder, builtFileName)}`);
		const oaxCommand = oaxPath + ' ' + oaxArguments.join(' ');
		const {stdout: bundle} = await execa.command(oaxCommand);


		const {code} = await swc
			.transform(bundle, {
				filename: src,
				jsc: {
					parser: {
						syntax: "ecmascript"
					},
					"target": "es3"
				}
			});

		return code;
	}
};
