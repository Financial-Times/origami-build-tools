'use strict';

var files = require('../helpers/files'),
	log = require('../helpers/log'),
	path = require('path'),
	fs = require('fs'),
	jshint = require('gulp-jshint'),
	scsslint = require('gulp-scss-lint'),
    excludePath = path.join(process.cwd(), '/.gitignore'),
    excludeFiles = pathsToGlob(fs.readFileSync(excludePath).toString().split('\n'));

module.exports = function(gulp, config) {
	module.exports.jsHint(gulp, config);
	module.exports.scssLint(gulp, config);
};

function pathsToGlob(paths) {
    for (var i = 0; i < paths.length; i++) {
        var currentPath = paths[i];
	    var isExistingDirectory = fs.existsSync(currentPath) && fs.statSync(currentPath).isDirectory();

	    if (isExistingDirectory) {
	        currentPath = path.join(currentPath, '/**');
	    }
	    paths[i] = '!'+currentPath;
    }
    return paths;
}

/**
 * Run the SCSS gulp plugin.
 */
module.exports.scssLint = function(gulp, config) {
    if (!config.sass && !files.sassExists()) {
        log.secondaryError('No main.scss');
        return;
    }
    var configPath = __dirname + '/../../config/scss-lint.yml';

    return gulp.src(['**/*.scss'].concat(excludeFiles))
    	.pipe(scsslint({
    		'config': configPath
    	}));
};

/**
 * Run the JSHint gulp plugin.
 */
module.exports.jsHint = function(gulp, config) {
    if(!config.js && !files.jsExists()) {
        log.secondaryError('No main.js');
        return;
    }

    var configPath = __dirname + '/../../config/jshint.json';

    return gulp.src(['**/*.js'].concat(excludeFiles))
            .pipe(jshint(configPath))
            .pipe(jshint.reporter('default'));
};

module.exports.watchable = true;
module.exports.description = 'Verify the module\'s conformity to the specification';
