"use strict";

const process = require('process');
const path = require('path');
const fileHelpers = require('../lib/helpers/files');

const karmaOax = require('../lib/karma-oax');
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
				'karma-*',
				karmaOax
			],

			// web server port
			port: 9876,

			// preprocess matching files before serving them to the browser
			// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
			preprocessors: {
				'test/**/*.js': ['oax'],
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
			singleRun: true
		};
	});
};
