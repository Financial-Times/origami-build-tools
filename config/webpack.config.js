const path = require('path');
const BowerResolvePlugin = require('bower-resolve-webpack-plugin');

module.exports = {
	// Fail out on the first error instead of tolerating it.
	// By default webpack will log these errors in red in the terminal,
	// as well as the browser console when using HMR,
	// but continue bundling.
	bail: true,

	// Cache the generated webpack modules and chunks to improve build speed.
	// Caching is enabled by default while in watch mode.
	// If an object is passed, webpack will use this object for caching.
	// Keeping a reference to this object will allow one to share the same cache between compiler calls:
	cache: false,

	resolve: {
		// This will handle a bower.json's `main` property being an array.
		plugins: [new BowerResolvePlugin()],
		// In which folders the resolver look for modules
		// relative paths are looked up in every parent folder (like node_modules)
		// absolute paths are looked up directly
		// the order is respected
		modules: ['bower_components', 'node_modules'],
		// These JSON files are read in directories
		descriptionFiles: ['bower.json', 'package.json'],
		// These fields in the description files are looked up when trying to resolve the package directory
		mainFields: ['browser', 'main'],
		// These files are tried when trying to resolve a directory
		mainFiles: ['index', 'main'],
		// These extensions are tried when resolving a file
		extensions: ['.js', '.json']
	},
	// Resolve loaders (webpack plugins) from the
	// directory of `OBT` itself rather than the project directory.
	resolveLoader: {
		modules: [
			path.resolve(__dirname, '../node_modules'),
			'node_modules',
			'bower_components'
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

							// TODO: Look into using preset-env instead and specifying our minimum versions
							// for enhanced experience instead of making everything become ES5
							presets: [
								require.resolve('babel-preset-es3'),
								require.resolve('babel-preset-es2015'),
								require.resolve('babel-preset-es2016'),
								require.resolve('babel-preset-es2017')
							],
							plugins: [
								[
									require.resolve('babel-plugin-add-module-exports'),
									// Polyfills the runtime needed for async/await and generators
									// Useful for applications rather than components.
									require.resolve('babel-plugin-transform-runtime'),
									{
										helpers: false,
										polyfill: false,
										regenerator: true,
										// Resolve the Babel runtime relative to the config.
										moduleName: path.dirname(require.resolve('babel-runtime/package')),
									},
								],
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
