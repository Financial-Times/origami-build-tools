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
	module.exports.lintspaces(gulp);
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
 * Run the SCSS gulp plugin.
 */
module.exports.scssLint = function(gulp, config) {
	if (!config.sass && !files.getMainSassPath()) {
		log.secondaryError('No main.scss');
		return;
	}
	var configPath = path.join(__dirname, '/../../config/scss-lint.yml');

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

	var configPath = path.join(__dirname, '/../../config/jshint.json');

	return gulp.src(['**/*.js'].concat(excludeFiles))
			.pipe(jshint(configPath))
			.pipe(jshint.reporter('default'));
};

module.exports.lintspaces = function(gulp) {
	if (!fs.existsSync('.editorconfig')) {
		log.secondaryError('No .editorconfig. Please run "origami-build-tools install --editorconfig" to add it');
	}
	return gulp.src(['**/*.scss', '**/*.js'].concat(excludeFiles))
		.pipe(lintspaces({
			newline: true,
			trailingspaces: true,
			indentation: 'tabs',
			ignores: ['js-comments'],
			editorconfig: '.editorconfig'
		}))
		.pipe(lintspaces.reporter())
		.on('error', function(err) { console.log(err) });
}

module.exports.watchable = true;
module.exports.description = 'Verify the module\'s conformity to the specification';
