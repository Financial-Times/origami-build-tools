'use strict';

var fs = require('fs');
var path = require('path');
var sass = require('gulp-ruby-sass');
var silentSass = require('../plugins/gulp-silent-sass.js');
var commandLine = require('../helpers/command-line');
var files = require('../helpers/files.js');
var log = require('../helpers/log.js');

function silentCompilationTest(gulp, silent) {
	return new Promise(function(resolve, reject) {
		if (files.getMainSassPath()) {
			files.getSassFilesList()
				.then(files.sassSupportsSilent)
				.then(function(supportsSilent) {
					if (supportsSilent) {
						var src = path.join(process.cwd(), '/main.scss');
						var sassVar = '$' + files.getBowerJson().name + '-is-silent: ' + silent + ';\n';

						var sassContent = fs.readFileSync(src, 'utf8');
						var tmpSrc = src.replace('.scss', '.tmp.scss');
						fs.writeFileSync(tmpSrc, sassVar + sassContent, 'utf8');

						sass(tmpSrc, {
								loadPath: ['.', 'bower_components'],
								style: 'compressed',
								sourcemap: false
							})
							.pipe(silentSass({silent: silent}))
							.on('error', function(err) {
								fs.unlink(tmpSrc);
								reject(err.message);
							})
							.on('end', function() {
								fs.unlink(tmpSrc);
								resolve(true);
							});
					} else {
						log.primary('This module doesn\'t support silent mode');
						resolve();
					}
				}, function(err) {
					reject(err);
				});
		} else {
			resolve();
		}
	});
}

module.exports = function(gulp) {
	module.exports.silentCompilation(gulp)
		.then(function() {
			return module.exports.nonSilentCompilation(gulp);
		}).catch(function(error) {
			log.primaryError(error);
			process.exit(1);
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
