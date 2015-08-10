'use strict';

var log = require('../helpers/log');
var path = require('path');
var fs = require('fs');
var eslint = require('gulp-eslint');
var scsslint = require('gulp-scss-lint');
var lintspaces = require('gulp-lintspaces');
var through = require('through2');
var combine = require('stream-combiner2');
var merge = require('merge-stream');
var gutil = require('gulp-util');

var cwd = process.cwd();
var excludePath = path.join(cwd, '/.gitignore');
var excludeFiles = [];

if (fs.existsSync(excludePath)) {
	excludeFiles = pathsToGlob(fs.readFileSync(excludePath).toString().split(/\r?\n/));
} else {
	log.secondary('No .gitignore found so command will run on all files in your project');
}

module.exports = function(gulp, config) {
	module.exports.origamiJson();
	return merge(
		module.exports.esLint(gulp, config),
		module.exports.scssLint(gulp, config),
		module.exports.lintspaces(gulp, config)
	);
};

function pathsToGlob(paths) {
	var globPatterns = [];
	function filterEmptyAndComments(line) {
		return line && line[0] !== '#';
	}

	function createGlobPatterns(line){
		var prefix = '';
		// if the line starts with a ! it's an inclusion so we remove the ! otherwise we add ! to make it an exclusion
		if(line[0] === '!'){
			line = line.slice(1);
		} else {
			prefix = '!';
		}

		if(line[line.length - 1] === '/'){
			// if it's a directory add ** to exclude everything within
			line = line + '**';
		} else {
			// if it's not explicitly a directory add a directory exclusion just in case
			globPatterns.push(prefix + path.join(cwd, line + '/**'));

		}

		// add the original line
		globPatterns.push(prefix + path.join(cwd, line));
		return line;
	}

	paths.filter(filterEmptyAndComments).forEach(createGlobPatterns);
	return globPatterns;
}

//
// Custom fail reporter that doesn't fail on SCSS-Lint warnings
//
function scsslintFailReporter() {
	var stream = through.obj(function(file, enc, cb) {
		var error;
		if (file.scsslint && file.scsslint.errors > 0) {
			error = new gutil.PluginError('gulp-scss-lint', {
				message: 'SCSS-Lint failed for: ' + file.relative,
				showStack: false
			});
		}

		return cb(error, file);
	});

	stream.resume();

	return stream;
}

//
// Custom fail reporter that doesn't fail on SCSS-Lint warnings
//
function lintspacesFailReporter() {
	var logLintspacesErrors = function(error, errorPath) {
		console.error(
			'[%s] %s in (%s:%d)\n',
			gutil.colors.green('gulp-lintspaces'),
			gutil.colors.red(error.message),
			errorPath,
			error.line
		);
	};

	var stream = through.obj(function(file, enc, cb) {
		var error;
		if (file.lintspaces && Object.keys(file.lintspaces).length) {
			for (var line in file.lintspaces) {
				if (file.lintspaces.hasOwnProperty(line)) {
					var lineErrors = file.lintspaces[line];
					for (var i = 0; i < lineErrors.length; i++) {
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
module.exports.scssLint = function(gulp, config) {
	config = config || {};
	var configPath = config.scssLintPath || path.join(__dirname, '/../../config/scss-lint.yml');

	// Exclude files specified in config.excludeFiles
	excludeFiles = excludeFiles.concat(config.excludeFiles || []);

	var combinedStream = combine.obj(
		gulp.src(['**/*.scss'].concat(excludeFiles)),
		scsslint({
			'config': configPath
		}),
		scsslintFailReporter()
	);

	// Returns a combined stream so an error handler can be attached to the end of the pipeline,
	// and it will have effects in all the steps. We need to resume() because stream-combiner2
	// seems to pause the stream and it doesn't reach the `end` event
	return combinedStream.resume();
};

//
// Run the ESLint gulp plugin.
//
module.exports.esLint = function(gulp, config) {
	config = config || {};
	var configPath = config.esLintPath || path.join(__dirname, '/../../config/.eslintrc');

	// Exclude files specified in config.excludeFiles
	excludeFiles = excludeFiles.concat(config.excludeFiles || []);

	var combinedStream = combine(
		gulp.src(['**/*.js'].concat(excludeFiles)),
		eslint({
			configFile: configPath,
			quiet: true
		}),
		eslint.format('compact', process.stdout),
		eslint.failAfterError()
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

	var editorconfigPath = config.editorconfigPath || path.join(__dirname, '/../../config/.editorconfig');

	var combinedStream = combine.obj(
		gulp.src(['**/*.scss', '**/*.js'].concat(excludeFiles)),
		lintspaces({
			newlineMaximum: 1,
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

module.exports.origamiJson = function() {
	return new Promise(function(resolve, reject) {
		var result = [];

		var origamiJsonPath = path.join(process.cwd(), '/origami.json');
		if (fs.existsSync(origamiJsonPath)) {
			log.secondary('Verifying your origami.json');
			var origamiJson = JSON.parse(fs.readFileSync(origamiJsonPath, 'utf8'));
			if (!origamiJson.description) {
				result.push('A non-empty description property is required');
			}
			if (origamiJson.origamiType !== 'module' && origamiJson.origamiType !== 'service') {
				result.push('The origamiType property needs to be set to either "module" or "service"');
			}
			if (origamiJson.origamiVersion !== 1) {
				result.push('The origamiVersion property needs to be set to 1');
			}
			if (!origamiJson.support) {
				result.push('The support property must be an email or url to an issue tracker for this module');
			}
			if (['active', 'maintained', 'deprecated', 'dead', 'experimental'].indexOf(origamiJson.supportStatus) === -1) {
				result.push('The supportStatus property must be set to either "active", "maintained", "deprecated", "dead" or "experimental"');
			}

			if (result.length > 0) {
				for (var i = 0; i < result.length; i++) {
					log.secondaryError(result[i]);
				}
				reject(result);
			} else {
				resolve(result);
			}
		}
	});
};

module.exports.watchable = false;
module.exports.description = 'Lint code and verify if module structure follows the Origami specification';
