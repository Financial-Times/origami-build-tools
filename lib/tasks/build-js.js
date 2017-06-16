'use strict';

const MemoryFS = require('memory-fs');
const webpack = require('webpack');
const path = require('path');
const denodeify = require('denodeify');
const outputFile = denodeify(require('fs-extra').outputFile);

const files = require('../helpers/files');
const webpackConfigProd = require('../../config/webpack.config.prod');
const webpackConfigDev = require('../../config/webpack.config.dev');
const memoryFS = new MemoryFS();

module.exports = function (config) {
	config = config || {
		flags: {}
	};

	let src;
	if (config.flags && config.flags.js) {
		src = Promise.resolve(config.flags.js);
	} else {
		src = files.getMainJsPath();
	}

	return src.then(code => {
		if (code) {
			let webpackConfig;
			if (config && config.flags && config.flags.production) {
				webpackConfig = webpackConfigProd;
			} else {
				webpackConfig = webpackConfigDev;
			}

			webpackConfig.entry = code;

			if (config && config.flags && config.flags.buildJs) {
				webpackConfig.output.filename = config.flags.buildJs;
			} else {
				webpackConfig.output.filename = 'main.js';
			}

			if (config && config.flags && config.flags.standalone) {
				webpackConfig.output.library = config.flags.standalone;
			}

			let destFolder;
			if (config && config.flags && config.flags.buildFolder) {
				destFolder = config.flags.buildFolder;
			} else {
				destFolder = files.getBuildFolderPath();
			}

			let file = '';
			return new Promise((resolve, reject) => {
				const compiler = webpack(webpackConfig, function (err, stats) {
					if (err) {
						reject(new Error(err));
					} else if (stats && stats.compilation.errors.toString()) {
						reject(new Error(stats.compilation.errors.toString()));
					} else {
						resolve(file);
					}
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
					return outputFile(path.join(destFolder, webpackConfig.output.filename), file)
						.then(() => file);
				});
		}
	});
};
