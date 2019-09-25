const process = require('process');
const path = require('path');
const webpackConfigDev = require('./webpack.config.dev');
const webpackConfigBower = require('../config/webpack.config.bower');
const webpackMerge = require('webpack-merge');
const fileHelpers = require('../lib/helpers/files');

// https://github.com/webpack/webpack/issues/3324#issuecomment-289720345
delete webpackConfigDev.bail;
module.exports.getBaseKarmaConfig = function (opts = { ignoreBower: false }) {
	return Promise.all([fileHelpers.getModuleName(), fileHelpers.getModuleBrands(), fileHelpers.readIfExists(path.resolve('main.scss'))]).then(values => {
		const moduleName = values[0];
		const brands = values[1];
		const mainScssContent = values[2];
		return {
			// enable / disable watching file and executing tests whenever any file changes
			autoWatch: false,

			// base path that will be used to resolve all patterns (eg. files, exclude)
			basePath: process.cwd(),

			browserDisconnectTimeout: 60 * 1000, // default 2000
			browserDisconnectTolerance: 3, // default 0
			browserNoActivityTimeout: 60 * 1000, // default 10000

			// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
			browsers: ['ChromeHeadless'],

			client: {
				// Capture all console output and pipe it to the terminal.
				captureConsole: false
			},

			captureTimeout: 60 * 2000, // default 60000,

			// enable / disable colors in the output (reporters and logs)
			colors: true,

			concurrency: 1, // default Infinity,

			// list of files to exclude
			exclude: [],

			// list of files / patterns to load in the browser
			files: [
				'test/*.js',
				'test/**/*.js',
				'main.scss'
			],

			// frameworks to use
			// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
			frameworks: ['mocha', 'sinon'],

			plugins: [
				'karma-mocha',
				'karma-sinon',
				'karma-webpack',
				'karma-browserstack-launcher',
				'karma-chrome-launcher',
				'karma-sourcemap-loader',
				'karma-scss-preprocessor'
			],

			// web server port
			port: 9876,

			// preprocess matching files before serving them to the browser
			// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
			preprocessors: {
				'test/*.js': ['webpack', 'sourcemap'],
				'test/**/*.js': ['webpack', 'sourcemap'],
				'main.scss': ['scss']
			},
			scssPreprocessor: {
				options: {
					file: '',
					data: `$system-code: "origami-build-tools";${brands.length ? `$o-brand: ${brands[0]};` : ''}$${moduleName}-is-silent: false; ${mainScssContent}`,
					includePaths: fileHelpers.getSassIncludePaths(process.cwd(), opts)
				}
			},

			// Continuous Integration mode
			// if true, Karma captures browsers, runs the tests and exits
			singleRun: true,

			webpack: opts.ignoreBower ? webpackConfigDev : webpackMerge(webpackConfigDev, webpackConfigBower),

			// Hide webpack output logging
			webpackMiddleware: {
				noInfo: true
			}
		};
	});
};
