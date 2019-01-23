const path = require('path');
const BowerResolvePlugin = require('bower-resolve-webpack-plugin');
const appRoot = require('app-root-path');

module.exports = {
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
	resolveLoader: {
		modules: [
			// Resolve loaders from the project directory. This is used for Origami Build Service as dependencies are
			// flattened by npm which causes the loaders to not be found.
			appRoot + '/node_modules',
			// Fallback to resolving loaders from OBT's node_modules folder if it has one. In most cases this is the
			// resolver that will return the loaders.
			path.resolve(__dirname, '../node_modules'),
			'node_modules',
			'bower_components'
		]
	}
};
