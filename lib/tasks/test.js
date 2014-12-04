"use strict";

var path = require('path');
var sass = require('gulp-ruby-sass');
var prefixer = require('../plugins/gulp-prefixer.js');
var silentSass = require('../plugins/gulp-silent-sass.js');
var commandLine = require('../helpers/command-line');
var files = require('../helpers/files.js');
var log = require('../helpers/log.js');

function silentCompilationTest(gulp, silent) {
	return new Promise(function(resolve) {
		if (files.getMainSassPath()) {
			files.getSASSFilesList()
				.then(files.sassSupportsSilent)
				.then(function(supportsSilent) {
					if (supportsSilent) {
						var src = path.join(process.cwd(), '/main.scss');
						var sassVar = '$' + files.getBowerJson().name + '-is-silent: ' + silent + ';\n';
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
				log.primary('Running "npm test"...');
				log.secondary(output.stdout);
			}, function(output) {
				log.primary('Running "npm test"...');
				log.secondaryError(output.stderr);
			});
	}
};

module.exports.watchable = true;
module.exports.description = 'Test if Sass silent compilation follows the Origami specification';
