'use strict';

var log = require('../helpers/log');
var path = require('path');
var fs = require('fs');
var jshint = require('gulp-jshint');
var scsslint = require('gulp-scss-lint');
var lintspaces = require('gulp-lintspaces');
var through = require('through2');
var gutil = require('gulp-util');
var merge = require('merge-stream');
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
		module.exports.jsHint(gulp, config),
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

/**
 * Custom fail reporter that doesn't fail on Scss Lint warnings
 */
function failReporter() {
	var stream = through.obj(function(file, enc, cb) {
		var error;
		if (file.scsslint.errors > 0) {
			error = new gutil.PluginError('gulp-scss-lint', {
				message: 'ScssLint failed for: ' + file.relative,
				showStack: false
			});
		}

		return cb(error, file);
	});

	stream.resume();

	return stream;
}

/**
 * Run the SCSS gulp plugin.
 */
module.exports.scssLint = function(gulp, config) {
	config = config || {};
	var configPath = config.scssLintPath || path.join(__dirname, '/../../config/scss-lint.yml');
	return gulp.src(['**/*.scss'].concat(excludeFiles))
		.pipe(scsslint({
			'config': configPath
		}))
		.pipe(failReporter());
};

/**
 * Run the JSHint gulp plugin.
 */
module.exports.jsHint = function(gulp, config) {
	config = config || {};
	var configPath = config.jsHintPath || path.join(__dirname, '/../../config/jshint.json');

	return gulp.src(['**/*.js'].concat(excludeFiles))
			.pipe(jshint(configPath))
			.pipe(jshint.reporter('default'))
			.pipe(jshint.reporter('fail'));
};

module.exports.lintspaces = function(gulp, config) {
	config = config || {};
	if (!config.editorconfigPath && fs.existsSync('.editorconfig')) {
		log.secondary('Using local .editorconfig file');
		config.editorconfig = '.editorconfig';
	}

	var editorconfigPath = config.editorconfigPath || path.join(__dirname, '/../../config/.editorconfig');

	return gulp.src(['**/*.scss', '**/*.js'].concat(excludeFiles))
		.pipe(lintspaces({
			ignores: ['js-comments'],
			newline: true,
			trailingspaces: true,
			indentation: 'tabs',
			editorconfig: editorconfigPath
		}))
		.pipe(lintspaces.reporter());
};

module.exports.origamiJson = function() {
	var result = {
		message: [],
		valid: true
	};
	var origamiJsonPath = path.join(process.cwd(), '/origami.json');
	if (fs.existsSync(origamiJsonPath)) {
		log.secondary('Verifying your origami.json');
		var origamiJson = JSON.parse(fs.readFileSync(origamiJsonPath, 'utf8'));
		if (!origamiJson.description) {
			result.message.push('A non-empty description property is required');
			result.valid = false;
		}
		if (origamiJson.origamiType !== 'module' && origamiJson.origamiType !== 'service') {
			result.message.push('The origamiType property needs to be set to either "module" or "service"');
			result.valid = false;
		}
		if (origamiJson.origamiVersion !== 1) {
			result.message.push('The origamiVersion property needs to be set to 1');
			result.valid = false;
		}
		if (!origamiJson.support) {
			result.message.push('The support property must be an email or url to an issue tracker for this module');
			result.valid = false;
		}
		if (['active', 'maintained', 'deprecated', 'dead', 'experimental'].indexOf(origamiJson.supportStatus) === -1) {
			result.message.push('The supportStatus property must be set to either "active", "maintained", "deprecated", "dead" or "experimental"');
			result.valid = false;
		}

		if (result.message.length > 0) {
			for (var i = 0; i < result.message.length; i++) {
				log.secondaryError(result.message[i]);
			}
		}

	}
	return result;
};

module.exports.watchable = true;
module.exports.description = 'Lint code and verify if module structure follows the Origami specification';
