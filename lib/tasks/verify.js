'use strict';

var files = require('../helpers/files'),
	log = require('../helpers/log'),
	path = require('path'),
	fs = require('fs'),
	jshint = require('gulp-jshint'),
	scsslint = require('gulp-scss-lint'),
	lintspaces = require('gulp-lintspaces'),
	excludePath = path.join(process.cwd(), '/.gitignore'),
	excludeFiles = pathsToGlob(fs.readFileSync(excludePath).toString().split('\n'));

module.exports = function(gulp, config) {
	module.exports.jsHint(gulp, config);
	module.exports.scssLint(gulp, config);
	module.exports.lintspaces(gulp, config);
};

function pathsToGlob(paths) {
	var globPatterns = [];
	function filterEmptyAndComments(line) {
		return line && line[0] !== '#';
	}

	function createGlobPatterns(line){
		// if the line starts with a ! it's an inclusion so we remove the ! otherwise we add ! to make it an exclusion
		if(line[0] === '!'){
			line = line.substring(1);
		} else {
			line = '!' + line;
		}

		// if it's a directory add ** to exclude everything within
		if(line[line.length - 1] === '/'){
			line += '**';
		} else {
			globPatterns.push(line + '/**');
		}

		globPatterns.push(line);
		return path.join(process.cwd(), line);
	}

	paths.filter(filterEmptyAndComments).forEach(createGlobPatterns);
	return globPatterns;
}

/**
 * Run the SCSS gulp plugin.
 */
module.exports.scssLint = function(gulp, config) {
	if (!config.sass && !files.getMainSassPath()) {
		log.secondaryError('No main.scss');
		return;
	}
	var configPath = config.scssLintPath || path.join(__dirname, '/../../config/scss-lint.yml');

	return gulp.src(['**/*.scss'].concat(excludeFiles))
		.pipe(scsslint({
			'config': configPath
		}));
};

/**
 * Run the JSHint gulp plugin.
 */
module.exports.jsHint = function(gulp, config) {
	if(!config.js && !files.getMainJsPath()) {
		log.secondary('No main.js');
		return;
	}

	var configPath = config.jsHintPath || path.join(__dirname, '/../../config/jshint.json');

	return gulp.src(['**/*.js'].concat(excludeFiles))
			.pipe(jshint(configPath))
			.pipe(jshint.reporter('default'));
};

module.exports.lintspaces = function(gulp, config) {
	if (!fs.existsSync('.editorconfig')) {
		log.secondaryError('No .editorconfig. Please run "origami-build-tools install --editorconfig" to add it');
	}

	var editorconfigPath = config.editorconfigPath || path.join(__dirname, '/config/.editorconfig');

	return gulp.src(['**/*.scss', '**/*.js'].concat(excludeFiles))
		.pipe(lintspaces({
			ignores: ['js-comments'],
			editorconfig: editorconfigPath
		}))
		.pipe(lintspaces.reporter())
		.on('error', function(err) { console.log(err); });
};

module.exports.watchable = true;
module.exports.description = 'Verify the module\'s conformity to the specification';
