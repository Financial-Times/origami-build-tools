const path = require('path');
const process = require('process');

// Temporary fix as aliased loaders don't pass in queries due to webpack bug
const textrequireifyPath = path.join(__dirname, '../lib/plugins/textrequireify-loader.js');

module.exports = {
	bail: true,
	resolve: {
		// In which folders the resolver look for modules
		// relative paths are looked up in every parent folder (like node_modules)
		// absolute paths are looked up directly
		// the order is respected
		modules: ['node_modules', 'bower_components'],

		// These JSON files are read in directories
		descriptionFiles: ['package.json', 'bower.json'],

		// These fields in the description files are looked up when trying to resolve the package directory
		mainFields: ['main', 'browser'],

		// These files are tried when trying to resolve a directory
		mainFiles: ['index', 'main'],

		// These fields in the description files offer aliasing in this package
		// The content of these fields is an object where requests to a key are mapped to the corresponding value
		aliasFields: ['browser'],

		// These extensions are tried when resolving a file
		extensions: ['.js', '.json'],
	},
	// Resolve loaders (webpack plugins) from the
	// directory of `OBT` itself rather than the project directory.
	resolveLoader: {
		modules: [
			path.resolve(__dirname, '../node_modules'),
			'node_modules',
			'bower_components'
		],
		alias: Object.assign({
			'textrequireify-loader': textrequireifyPath
		})
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
					textrequireifyPath + '?cwd=' + process.cwd(),
					// Disables AMD module loading
					'imports-loader?define=>false',
					{
						loader: 'babel-loader',
						options: {

							// TODO: Look into using preset-env instead and specifying our minimum versions
							// for enhanced experience instead of making everything become ES5
							presets: [
								require.resolve('babel-preset-es2015')
							],
							plugins: [
								// Polyfills the runtime needed for async/await and generators
								// Useful for applications rather than components.
								[
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

			// TODO: Look into which components (if any) are importing html files into their JS.
			{
				test: /\.html$/,
				use: 'raw-loader'
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
