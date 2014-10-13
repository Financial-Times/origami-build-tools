"use strict";

var Promise = require('es6-promise').Promise,
    sass = require('gulp-ruby-sass'),
    prefixer = require('../plugins/gulp-prefixer.js'),
    silentSass = require('../plugins/gulp-silent-sass.js'),
    commandLine = require('../helpers/command-line'),
    files = require('../helpers/files.js'),
    log = require('../helpers/log.js');

function silentCompilationTest(gulp, silent) {
    return new Promise(function(resolve) {
        if (files.sassExists()) {
            files.getSASSFilesList()
                .then(files.sassSupportsSilent)
                .then(function(supportsSilent) {
                    if (supportsSilent) {
                        var src = process.cwd() + '/main.scss',
                            sassVar = '$' + files.getBowerJson().name + '-is-silent: ' + silent + ';\n';
                        gulp.src(src)
                            .pipe(prefixer(sassVar))
                            .pipe(sass({loadPath: ['.', 'bower_components'], style: 'compressed', sourcemap: false}))
                            .on('error', function(err) { console.log(err.message);})
                            .pipe(silentSass({silent: silent}))
                            .on('end', function() { 
                                resolve(true);
                            });
                    } else {
                        log.primary('This module doesn\'t support silent mode');
                        resolve(false);
                    }
                }, function(err) {
                    log.primaryError(err);
                });
        } else {
            resolve(false);
        }
    });
}
module.exports = function(gulp) {
    module.exports.silentCompilation(gulp)
        .then(function() {
            return module.exports.nonSilentCompilation(gulp);
        });
    module.exports.npmTest();
};

module.exports.silentCompilation = function(gulp) {
    return silentCompilationTest(gulp, true);
};

module.exports.nonSilentCompilation = function(gulp) {
    return silentCompilationTest(gulp, false);
};

module.exports.npmTest = function() {
    var packageJson = files.getPackageJson();
    if (packageJson && packageJson.scripts && packageJson.scripts.test) {
         commandLine.run('npm', ['test'])
            .then(function(output) {
                log.primary('Running "npm test"...')
                log.secondary(output.stdout);
            }, function(output) {
                log.primary('Running "npm test"...')
                log.secondaryError(output.stderr);
            });
    }
}

module.exports.watchable = true;
module.exports.description = 'Test SASS has silent mode set following the Origami spec';
