'use strict';

var fs = require('fs');
var path = require('path');
var fs = require('fs');
var sass = require('gulp-ruby-sass');
var nightwatch = require('gulp-nightwatch');
var haikro = {
	build: require('haikro/lib/build'),
	create: require('haikro/lib/create'),
	deploy: require('haikro/lib/deploy'),
	destroy: require('haikro/lib/destroy'),
	logger: require('haikro/lib/logger')
};
var silentSass = require('../plugins/gulp-silent-sass.js');
var commandLine = require('../helpers/command-line');
var files = require('../helpers/files.js');
var log = require('../helpers/log.js');
var demo = require('./demo.js');

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
	// module.exports.silentCompilation(gulp)
	// 	.then(function() {
	// 		return module.exports.nonSilentCompilation(gulp);
	// 	}).catch(function(error) {
	// 		log.primaryError(error);
	// 		process.exit(1);
	// 	});
	// module.exports.npmTest();
	module.exports.browserTest();
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

function nightwatch(gulp, config) {
	return new Promise(function(resolve, reject) {

	});
}

module.exports.browserTest = function(gulp, config) {
	var appName = files.getModuleName();
	var token;
	var commit;
	haikro.logger.setLevel('debug');
	return Promise.all([
		process.env.HEROKU_AUTH_TOKEN ? promise.resolve(process.env.HEROKU_AUTH_TOKEN) : commandLine.run('heroku', ['auth:token']),
		commandLine.run('git', ['rev-parse HEAD']),
		commandLine.run('npm', ['install', 'http-server'])
	])
	.then(function(results) {
		token = results[0].stdout.trim();
		commit = results[1].stdout.trim();
		appName = appName + commit.substr(0, 5);
		return haikro.create({
			app: appName,
			region: 'eu',
			// organization: 'financial-times',
			token: token
		});
	})
	.then(function(results) {
		// token = results[0].stdout.trim();
		// commit = results[1].stdout.trim();
		// appName = appName + commit.substr(0, 5);
		fs.writeFileSync('Procfile', 'web: http-server demos/local', 'utf8');
		return haikro.build({
			project: process.cwd()
		});
	})
	.then(function() {
		return haikro.deploy({
			app: appName,
			token: token,
			project: process.cwd(),
			commit: commit
		});
	})
	// .then(function(app) {
	// 	console.log(1, app);
	// 	return haikro.destroy({
	// 		token: token,
	// 		app: moduleName
	// 	});
	// })
	.then(function() {
		//fs.unlink('Procfile');
	})
	.catch(function(e) {
		log.secondaryError(e);
	});
};

module.exports.watchable = true;
module.exports.description = 'Test if Sass silent compilation follows the Origami specification';
