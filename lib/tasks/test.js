/*global require, exports, process */

"use strict";

var fs = require('fs'),
    sass = require('gulp-ruby-sass'),
    prefixer = require('../plugins/gulp-prefixer.js'),
    silentSass = require('../plugins/gulp-silent-sass.js'),
    files = require('../helpers/files.js'),
    log = require('../helpers/log.js');

function silentCompilationTest(gulp, silent) {
    if (files.sassExists()) {
        files.sassSupportsSilent(function(supportsSilent) {
            if (supportsSilent) {
                var src = process.cwd() + '/main.scss',
                    sassVar = '$' + files.getBowerJson().name + '-is-silent: ' + silent + ';\n';
                return gulp.src(src)
                    .pipe(prefixer(sassVar))
                    .pipe(sass({loadPath: ['.', 'bower_components'], style: 'compressed', sourcemap: false}))
                    .on('error', function(err) { console.log(err.message);})
                    .pipe(silentSass({silent: silent}))
            } else {
                log.primary('This module doesn\'t support silent mode');
            }
        });
    }
}
module.exports = function(gulp) {
    module.exports.silentCompilation(gulp);
    module.exports.nonSilentCompilation(gulp);    
}

module.exports.silentCompilation = function(gulp) {
    return silentCompilationTest(gulp, true);
}

module.exports.nonSilentCompilation = function(gulp) {
    return silentCompilationTest(gulp, false);
}

module.exports.watchable = true;
module.exports.description = 'Test SASS has silent mode set following the Origami spec';