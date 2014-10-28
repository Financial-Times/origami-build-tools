'use strict';

var files = require('../helpers/files'),
	log = require('../helpers/log'),
	path = require('path'),
	fs = require('fs'),
	jshint = require('gulp-jshint'),
	scsslint = require('gulp-scss-lint'),
	lintspaces = require('gulp-lintspaces'),
	cwd = process.cwd(),
	excludePath = path.join(cwd, '/.gitignore'),
	excludeFiles = [];

if (fs.existsSync(excludePath)) {
	excludeFiles = pathsToGlob(fs.readFileSync(excludePath).toString().split('\n'));
} else {
	log.secondary('No .gitignore found so command will run on all files in your project');
}

module.exports = function(gulp, config) {
	module.exports.jsHint(gulp, config);
	module.exports.scssLint(gulp, config);
	module.exports.lintspaces(gulp, config);
	module.exports.origamiJson();
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
 * Run the SCSS gulp plugin.
 */
module.exports.scssLint = function(gulp, config) {
	var config = config || {};
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
	var config = config || {};
	if (!config.js && !files.getMainJsPath()) {
		log.secondary('No main.js');
		return;
	}

	var configPath = config.jsHintPath || path.join(__dirname, '/../../config/jshint.json');

	return gulp.src(['**/*.js'].concat(excludeFiles))
			.pipe(jshint(configPath))
			.pipe(jshint.reporter('default'));
};

module.exports.lintspaces = function(gulp, config) {
	var config = config || {};
	if (!fs.existsSync('.editorconfig')) {
		log.secondary('No .editorconfig. Please run "origami-build-tools install --editorconfig" to add it');
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
		.pipe(lintspaces.reporter())
		.on('error', function(err) { console.log(err); });
};

module.exports.origamiJson = function() {
	var origamiJsonPath = path.join(process.cwd(), '/origami.json');
	if (fs.existsSync(origamiJsonPath)) {
		log.secondary('Verifying your origami.json');
		var origamiJson = require(origamiJsonPath),
			valid = true;
		if (!origamiJson.description) {
			log.secondaryError('A non-empty description property is required');
			valid = false;
		}
		if (origamiJson.origamiType !== 'module' && origamiJson.origamiType !== 'service') {
			log.secondaryError('The origamiType property needs to be set to either "module" or "service"');
			valid = false;
		}

		if (origamiJson.origamiVersion !== 1) {
			log.secondaryError('The origamiVersion property needs to be set to 1');
			valid = false;
		}
		if (!origamiJson.support) {
			log.secondaryError('The support property must be an email or url to an issue tracker for this module');
		}
		if (['active', 'maintained', 'deprecated', 'dead', 'experimental'].indexOf(origamiJson.supportStatus) === -1) {
			log.secondaryError('The supportStatus property must be set to either "active", "maintained", "deprecated", "dead" or "experimental"');
			valid = false;
		}

		return valid;
	}
};

module.exports.watchable = true;
module.exports.description = 'Verify the module\'s conformity to the specification';
