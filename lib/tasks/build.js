/*global require, module, process */
"use strict";

var fs = require('fs'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    sass = require('gulp-ruby-sass'),
    rename = require('gulp-rename'),
    csso = require('gulp-csso'),
    uglify = require('gulp-uglify'),
    files = require('../helpers/files'),
    log = require('../helpers/log');

module.exports = function(gulp, config) {
    module.exports.js(gulp, config);
    module.exports.sass(gulp, config);
}

module.exports.js = function(gulp, config) {
    config = config ? config : {};
    if (config.js || files.jsExists()) {
        var src = config.js ? config.js : process.cwd() + '/main.js',
            destFolder = config.buildFolder ? config.buildFolder : files.getBuildFolderPath(),
            dest = config.buildJs ? config.buildJs : 'main.js';
        log.secondary("Browserifying " + src);
        return browserify(src)
            .require(src, {})
            .transform({}, 'debowerify')
            .transform({}, 'textrequireify')
            .bundle({debug: true})
            .pipe(source(dest))
            .pipe(uglify())
            .pipe(gulp.dest(destFolder));
    }

};

module.exports.sass = function(gulp, config) {
    config = config ? config : {};
    if (config.sass || files.sassExists()) {
            var src = config.sass ? config.sass : process.cwd() + '/main.scss',
                destFolder = config.buildFolder ? config.buildFolder : files.getBuildFolderPath(),
                dest = config.buildCss ? config.buildCss : 'main.css';
            log.secondary("Compiling " + src);
            var sassConfig = {
                style: 'compressed', 
                loadPath: ['.', 'bower_components']
            }
            if (config.sourcemapPath) {
                sassConfig.sourcemapPath = config.sourcemapPath;
            }
            return gulp.src(src)
                .pipe(sass(sassConfig))
                .on('error', function(err) { console.log(err.message);})
                .pipe(csso())
                .pipe(gulp.dest(destFolder))
                .pipe(rename(dest));
    }
};


module.exports.watchable = true;
module.exports.description = 'Builds the Origami module';
