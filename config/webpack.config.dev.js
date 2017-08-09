const webpack = require('webpack');
const webpackMerge = require('webpack-merge');

const devConfig = {
	plugins: [
		new webpack.NamedModulesPlugin(),
		new webpack.NormalModuleReplacementPlugin(/^sinon$/,require.resolve('sinon'))
	],
	devtool: 'inline-source-map'
};

module.exports = webpackMerge(require('./webpack.config'), devConfig);
