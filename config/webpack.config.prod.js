const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const prodConfig = {
	plugins: [
		// Makes some environment variables available to the JS code, for example:
		// if (process.env.NODE_ENV === 'production') { ... }.
		// It is important that NODE_ENV is set to production here.
		// Otherwise libraries such as React will be compiled in development mode.
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify('production')
		}),
		// Minify code, IE8 is core experience, by setting the screw_ie8 option
		// we can use some newer minification techniques.
		new UglifyJsPlugin({
			uglifyOptions: {
				ie8: false,
				compress: {
					warnings: false,
				},
				output: {
					comments: false,
				},
				sourceMap: true,
			}
		}),
		// Generate stable module ids instead of having Webpack assign integers.
		// HashedModuleIdsPlugin (vendored from Webpack 2) does this without
		// adding too much to bundle size and NamedModulesPlugin allows for
		// easier debugging of development builds.
		new webpack.HashedModuleIdsPlugin(),
	]
};

module.exports = webpackMerge(require('./webpack.config'), prodConfig);
