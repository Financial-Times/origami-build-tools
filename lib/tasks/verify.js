'use strict';

const log = require('../helpers/log');
const path = require('path');
const fs = require('fs');
const sasslint = require('gulp-sass-lint');
const lintspaces = require('gulp-lintspaces');
const through = require('through2');
const combine = require('stream-combiner2');
const gutil = require('gulp-util');
const verifyOrigamiJsonFile = require('./verify-origami-json');
const verifyJavaScript = require('./verify-javascript');

const cwd = process.cwd();
const excludePath = path.join(cwd, '/.gitignore');
let excludeFiles = [];

if (fs.existsSync(excludePath)) {
	excludeFiles = pathsToGlob(fs.readFileSync(excludePath).toString().split(/\r?\n/));
}

module.exports = function () {
	const Listr = require('listr');

	return new Listr(
		[
			verifyOrigamiJsonFile,
			verifyJavaScript
		]
	)
	.run();
};

function pathsToGlob(paths) {

	function filterEmptyAndComments(line) {
		return line && line[0] !== '#';
	}

	return paths.filter(filterEmptyAndComments);
}

//
// Custom fail reporter that doesn't fail on Sass-Lint warnings
//
function lintspacesFailReporter() {
	const logLintspacesErrors = function(error, errorPath) {
		console.error(
			'[%s] %s in (%s:%d)\n',
			gutil.colors.green('gulp-lintspaces'),
			gutil.colors.red(error.message),
			errorPath,
			error.line
		);
	};

	const stream = through.obj(function(file, enc, cb) {
		let error;
		if (file.lintspaces && Object.keys(file.lintspaces).length) {
			for (const line in file.lintspaces) {
				if (Object.prototype.hasOwnProperty.call(file.lintspaces, line)) {
					const lineErrors = file.lintspaces[line];
					for (let i = 0; i < lineErrors.length; i++) {
						logLintspacesErrors(lineErrors[i], file.path);
					}
				}
			}

			error = new gutil.PluginError('gulp-lintspaces', {
				message: 'Lintspaces failed for: ' + file.relative,
				showStack: false
			});
		}

		return cb(error, file);
	});

	stream.resume();

	return stream;
}

//
// Run the SCSS gulp plugin.
//
module.exports.sassLint = function(gulp, config) {
	config = config || {};
	const configPath = config.sassLintPath || path.join(__dirname, '/../../config/scss-lint.yml');

	// Exclude files specified in config.excludeFiles
	excludeFiles = excludeFiles.concat(config.excludeFiles || []);

	const combinedStream = combine.obj(
		gulp.src(['**/*.scss'].concat(excludeFiles)),
		sasslint({
			'configFile': configPath
		}),
		sasslint.format(),
		sasslint.failOnError()
	);

	// Returns a combined stream so an error handler can be attached to the end of the pipeline,
	// and it will have effects in all the steps. We need to resume() because stream-combiner2
	// seems to pause the stream and it doesn't reach the `end` event
	return combinedStream.resume();
};

module.exports.lintspaces = function(gulp, config) {
	config = config || {};
	if (!config.editorconfigPath && fs.existsSync('.editorconfig')) {
		log.secondary('Using local .editorconfig file');
		config.editorconfig = '.editorconfig';
	}

	const editorconfigPath = config.editorconfigPath || path.join(__dirname, '/../../config/.editorconfig');

	const combinedStream = combine.obj(
		gulp.src(['**/*.scss', '**/*.js'].concat(excludeFiles)),
		lintspaces({
			ignores: ['js-comments'],
			editorconfig: editorconfigPath
		}),
		lintspacesFailReporter()
	);

	// Returns a combined stream so an error handler can be attached to the end of the pipeline,
	// and it will have effects in all the steps. We need to resume() because stream-combiner2
	// seems to pause the stream and it doesn't reach the `end` event
	return combinedStream.resume();
};

module.exports.watchable = false;
