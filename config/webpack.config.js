const path = require('path');
const appRoot = require('app-root-path');

module.exports = {
	resolveLoader: {
		modules: [
			// Resolve loaders from the project directory. This is used for Origami Build Service as dependencies are
			// flattened by npm which causes the loaders to not be found.
			appRoot + '/node_modules',
			// Fallback to resolving loaders from OBT's node_modules folder if it has one. In most cases this is the
			// resolver that will return the loaders.
			path.resolve(__dirname, '../node_modules'),
			'node_modules'
		]
	},
	module: {
		rules: [
			// Disable require.ensure as it's not a standard language feature.
			{ parser: { requireEnsure: false } },
			// Process JS with Babel.
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: [
					// Disables AMD module loading and swaps requireText() for require()
					'imports-loader?define=>false&requireText=>require',
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
								require.resolve('@babel/plugin-transform-runtime')
							],
						}
					}]
			},

			// Components which are importing html/mustache/txt/text files into their JS:
			// markets-chat, o-chat, web-chat
			{
				test: /\.html$/,
				exclude: /node_modules/,
				use: require.resolve('raw-loader')
			},
			{
				test: /\.mustache$/,
				exclude: /node_modules/,
				use: require.resolve('raw-loader')
			},
			{
				test: /\.txt$/,
				exclude: /node_modules/,
				use: require.resolve('raw-loader')
			},
			{
				test: /\.text$/,
				exclude: /node_modules/,
				use: require.resolve('raw-loader')
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
