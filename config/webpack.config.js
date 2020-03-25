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
				use: [
					{
						loader: 'babel-loader',
						options: {
							compact: false,

							// TODO: Look into specifying our minimum versions in preset-env
							// for enhanced experience instead of making everything become ES5
							presets: [
								[
									require.resolve('@babel/preset-env'),
									{
										targets: {ie: "11" }
									}
								]
							],
							plugins: [
								// Polyfills the runtime needed for async/await and generators
								// Useful for applications rather than components.
								[
									require.resolve('@babel/plugin-transform-runtime'),
									{
									  "absoluteRuntime": false,
									  "corejs": false,
									  "helpers": false,
									  "regenerator": true,
									  "useESModules": true,
									  "version": "7.9.2"
									}
								  ]
							],
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
