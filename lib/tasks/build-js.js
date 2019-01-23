'use strict';

const MemoryFS = require('memory-fs');
const webpack = require('webpack');
const path = require('path');
const denodeify = require('denodeify');
const outputFile = denodeify(require('fs-extra').outputFile);

const files = require('../helpers/files');
const webpackConfigProd = require('../../config/webpack.config.prod');
const webpackConfigDev = require('../../config/webpack.config.dev');
const webpackConfigBower = require('../../config/webpack.config.bower');
const webpackMerge = require('webpack-merge');
const memoryFS = new MemoryFS();

function getWebpackConfig (config) {
	return webpackMerge(
		config.production
			? webpackConfigProd
			: webpackConfigDev,
		config.ignoreBower
			? {}
			: webpackConfigBower
	);
}


module.exports = function (cfg) {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	let src;
	if (config.js) {
		src = Promise.resolve(config.js);
	} else {
		src = files.getMainJsPath();
	}

	return src.then(code => {
		if (code) {
			const webpackConfig = getWebpackConfig(config);

			webpackConfig.entry = code;

			if (config && config.buildJs) {
				webpackConfig.output.filename = config.buildJs;
			} else {
				webpackConfig.output.filename = 'main.js';
			}

			if (config && config.standalone) {
				webpackConfig.output.library = config.standalone;
			}

			let destFolder;
			if (config && config.buildFolder) {
				destFolder = config.buildFolder;
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
