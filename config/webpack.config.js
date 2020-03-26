"use strict";

const path = require('path');

module.exports = {
	resolveLoader: {
		modules: [
			// Fallback to resolving loaders from OBT's node_modules folder if it has one. In most cases this is the
			// resolver that will return the loaders.
			path.resolve(__dirname, '../node_modules'),
			'node_modules'
		]
	},
	module: {
		rules: [
			// Process JS with Babel.
			{
				test: /\.js$/,
				exclude: /(node_modules|bower_components)/,
				use: [
					{
						loader: 'swc-loader',
						options: {
							"env": {
								"targets": {
									"ie": "11"
								}
							}
						}
					}]
			}
		]
	},
	output: {
		devtoolModuleFilenameTemplate: '[resource-path]',
		filename: 'main.js',
	},
	// Some libraries import Node modules but don't use them in the browser.
	// Tell Webpack to provide empty mocks for them so importing them works.
	node: {
		fs: 'empty',
		net: 'empty',
		tls: 'empty',
	}
};
