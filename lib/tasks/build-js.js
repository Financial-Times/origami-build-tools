'use strict';

const MemoryFS = require('memory-fs');
const webpack = require('webpack');
const path = require('path');
const outputFile = require('fs-extra').outputFile;

const files = require('../helpers/files');
const webpackConfigProd = require('../../config/webpack.config.prod');
const webpackConfigDev = require('../../config/webpack.config.dev');
const memoryFS = new MemoryFS();

module.exports = function (config = { flags: {} }) {

	const src = config.flags.js ? config.flags.js : files.getMainJsPath();

	if (src) {
		const webpackConfig = config.flags.production ? webpackConfigProd : webpackConfigDev;

		webpackConfig.entry = src;

		if (config.flags.buildJs) {
			webpackConfig.output.filename = config.flags.buildJs;
		} else {
			webpackConfig.output.filename = 'main.js';
		}

		if (config.flags.standalone) {
			webpackConfig.output.library = config.flags.standalone;
		}

		const destFolder = config.flags.buildFolder ? config.flags.buildFolder : files.getBuildFolderPath();

		let file;
		return new Promise((resolve, reject) => {
			const compiler = webpack(webpackConfig, function (err, stats) {
				if (err) {
					reject(new Error(err));
				}
				if (stats && stats.compilation.errors.toString()) {
					reject(new Error(stats.compilation.errors.toString()));
				}
				resolve(file);
			});

			compiler.outputFileSystem = memoryFS;

			compiler.plugin('after-emit', function (compilation, callback) {
				Object.keys(compilation.assets).forEach(function (outname) {
					if (compilation.assets[outname].emitted) {
						file += memoryFS.readFileSync(memoryFS.join(compiler.outputPath, outname));
					}
				});
				callback();
			});
		})
			.then(file => {
				return outputFile(path.join(destFolder, webpackConfig.output.filename), file);
			})
			.then(() => file);
	}
};
