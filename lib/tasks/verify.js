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
	// module.exports.jsHint(gulp, config);
	// module.exports.scssLint(gulp, config);
	// module.exports.lintspaces(gulp);
	module.exports.origamiJson(gulp);
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

module.exports.origamiJson = function(gulp) {
	if (fs.existsSync('origami.json')) {
		log.secondary('Verifying your origami.json');
		var origamiJson = require('origami.json'),
			valid = true;
		if (!origamiJson.description) {
			log.secondaryError('A non-empty description property is required');
			valid = false;
		} 
		if (origamiJson.origamiType !== 'module' || origamiJson.origamiType !== 'service') {
			log.secondaryError('The origamiType property needs to be set to either "module" or "service"');
			valid = false;
		} 

		if (origamiJson.version !== 1) {
			log.secondaryError('The version property needs to be set to 1');
			valid = false;
		}
		if (['active', 'maintained', 'deprecated', 'dead', 'experimental'].indexOf(origamiJson.support === -1)) {
			log.secondaryError('The support property should be set to either "active", "maintained", "deprecated", "dead" or "experimental"');
			valid = false;
		}

		return valid;
	}
}

module.exports.watchable = true;
module.exports.description = 'Verify the module\'s conformity to the specification';
