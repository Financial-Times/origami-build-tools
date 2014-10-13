"use strict";

var browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    streamify = require('gulp-streamify'),
    sass = require('gulp-ruby-sass'),
    csso = require('gulp-csso'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    files = require('../helpers/files'),
    log = require('../helpers/log');

module.exports = function(gulp, config) {
    module.exports.js(gulp, config);
    module.exports.sass(gulp, config);
};

module.exports.js = function(gulp, config) {
    var src = config.js || files.getMainJsPath() || null;
    if (src) {
        var destFolder = config.buildFolder || files.getBuildFolderPath(),
            dest = config.buildJs || 'main.js';
        log.secondary("Browserifying " + src);
        return browserify(src)
            .require(src, {})
            .transform({}, 'debowerify')
            .transform({}, 'textrequireify')
            .bundle({debug: true})
            .pipe(source(dest))
            .pipe(streamify(uglify()))
            .pipe(gulp.dest(destFolder));
    }
};

module.exports.sass = function(gulp, config) {
    var src = config.sass || files.getMainSassPath() || null;
    if (src) {
            var destFolder = config.buildFolder || files.getBuildFolderPath(),
                dest = config.buildCss || 'main.css';
            log.secondary("Compiling " + src);
            var sassConfig = {
                style: 'compressed', 
                loadPath: ['.', 'bower_components']
            };
            // Sourcemaps aren't compatible with csso, we'll look for a work-around when gulp-ruby-sass 1.0 is released
            // if (config.sourcemap) {
            //     sassConfig.sourcemap = config.sourcemap;
            // }
            // if (config.sourcemapPath) {
            //     sassConfig.sourcemapPath = config.sourcemapPath;
            // }
            return gulp.src(src)
                .pipe(sass(sassConfig))
                .pipe(csso())
                .pipe(rename(dest))
                .pipe(gulp.dest(destFolder))
                .on('error', function(err) { console.log(err.message);});
    }
};


module.exports.watchable = true;
module.exports.description = 'Builds the Origami module';
