'use strict';

var files = require('../helpers/files'),
	log = require('../helpers/log'),
	path = require('path'),
	fs = require('fs'),
	jshint = require('gulp-jshint'),
	scsslint = require('gulp-scss-lint'),
    excludePath = path.join(process.cwd(), '/.gitignore'),
    excludeFiles = pathsToGlob(fs.readFileSync(excludePath).toString().split(/\r?\n/));

module.exports = function(gulp, config) {
	module.exports.jsHint(gulp, config);
	module.exports.scssLint(gulp, config);
};

function pathsToGlob(paths) {

    function filterEmptyAndComments(line) { 
        return line && line[0] !== '#';
    }

    function createGlobPatterns(line){
        // if it's a directory add ** to exclude everything within
        if(line[line.length - 1] === '/'){
            line += '**';
        }

        // if the line starts with a ! it's an inclusion so we remove the ! otherwise we add ! to make it an exclusion
        if(line[0] === '!'){
            line = line.substring(1);
        } else {
            line = '!' + line;
        }
        return line;
    }

    return paths.filter(filterEmptyAndComments).map(createGlobPatterns);
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
        log.secondaryError('No main.js');
        return;
    }

    var configPath = path.join(__dirname, '/../../config/jshint.json');

    return gulp.src(['**/*.js'].concat(excludeFiles))
            .pipe(jshint(configPath))
            .pipe(jshint.reporter('default'));
};

module.exports.watchable = true;
module.exports.description = 'Verify the module\'s conformity to the specification';
