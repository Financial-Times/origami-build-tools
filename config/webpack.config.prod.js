const webpack = require('webpack');
const webpackMerge = require('webpack-merge');

const prodConfig = {
	plugins: [
		// Generate stable module ids instead of having Webpack assign integers.
		// HashedModuleIdsPlugin (vendored from Webpack 2) does this without
		// adding too much to bundle size and NamedModulesPlugin allows for
		// easier debugging of development builds.
		new webpack.HashedModuleIdsPlugin(),
	],
	mode: 'production'
};

module.exports = webpackMerge(require('./webpack.config'), prodConfig);
