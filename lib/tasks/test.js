'use strict';

var path = require('path');
var fs = require('fs');
var sass = require('gulp-ruby-sass');
var haikro = {
	build: require('haikro/lib/build'),
	create: require('haikro/lib/create'),
	deploy: require('haikro/lib/deploy'),
	destroy: require('haikro/lib/destroy'),
	logger: require('haikro/lib/logger')
};
var prefixer = require('../plugins/gulp-prefixer.js');
var silentSass = require('../plugins/gulp-silent-sass.js');
var commandLine = require('../helpers/command-line');
var files = require('../helpers/files.js');
var log = require('../helpers/log.js');
var demo = require('./demo.js');

function silentCompilationTest(gulp, silent) {
	return new Promise(function(resolve, reject) {
		if (files.getMainSassPath()) {
			files.getSASSFilesList()
				.then(files.sassSupportsSilent)
				.then(function(supportsSilent) {
					if (supportsSilent) {
						var src = path.join(process.cwd(), '/main.scss');
						var sassVar = '$' + files.getBowerJson().name + '-is-silent: ' + silent + ';\n';
						gulp.src(src)
							.pipe(prefixer(sassVar))
							.pipe(sass({loadPath: ['.', 'bower_components'], style: 'compressed', "sourcemap=none": true}))
							.pipe(silentSass({silent: silent}))
							.on('error', function(err) {
								reject(err.message);
							})
							.on('end', function() {
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

module.exports = function(gulp, config) {
	module.exports.silentCompilation(gulp)
		.then(function() {
			return module.exports.nonSilentCompilation(gulp);
		}).catch(function(error) {
			log.primaryError(error);
			process.exit(1);
		});
	module.exports.npmTest();
	// if (config.browserTest) {
	// 	module.exports.browserTest(gulp, config);
	// }
};

module.exports.silentCompilation = function(gulp) {
	return silentCompilationTest(gulp, true);
};

module.exports.nonSilentCompilation = function(gulp) {
	return silentCompilationTest(gulp, false);
};

module.exports.npmTest = function() {
	return new Promise(function(resolve, reject) {
		var packageJson = files.getPackageJson();
		if (packageJson && packageJson.scripts && packageJson.scripts.test) {
			commandLine.run('npm', ['test'])
				.then(function(output) {
					log.primary('Running "npm test"...');
					log.secondary(output.stdout);
				}, function(output) {
					log.primary('Running "npm test"...');
					log.secondary(output.stdout);
					log.secondaryError(output.stderr);
					process.exit(1);
				});
		}
	});
};

module.exports._runBrowserTest = function(config) {
	return new Promise(function(resolve, reject) {
		var nightwatchCommand = path.resolve('.', 'node_modules/nightwatch/bin/nightwatch');
		var nightwatchConfigPath = config.nightwatchConfig || path.resolve('.', 'test/browser/nightwatch.json');
		fs.readFile(nightwatchConfigPath, function(err, configContent) {
			if (err) {
				reject(err);
			}

			configContent = JSON.parse(configContent);
			configContent.test_settings.default.launch_url = config.testUrl;

			fs.writeFile(nightwatchConfigPath, JSON.stringify(configContent), function(error) {
				if (error) {
					reject(error);
				}

				resolve(commandLine.run(nightwatchCommand, ['--group', 'test/browser/tests',
						'--config', nightwatchConfigPath,
						'--env', ' chrome37_Grid,chrome38_Grid,chrome39_Grid,chrome40_Grid,firefox30_Grid,firefox31_Grid,firefox32_Grid,firefox33_Grid,firefox34_Grid,firefox35_Grid,ie8_Grid,ie9_Grid,ie10_Grid,ie11_Grid,safari7_Grid'
				]));
			});

		});
	});
}

module.exports.browserTest = function(gulp, config) {
	config = config || {};
	var appName = files.getModuleName();
	var token;
	var commit;
	haikro.logger.setLevel('debug');
	return Promise.all([
		process.env.HEROKU_AUTH_TOKEN ? Promise.resolve(process.env.HEROKU_AUTH_TOKEN) : commandLine.run('heroku', ['auth:token']),
		commandLine.run('git', ['rev-parse HEAD']),
		commandLine.run('npm', ['install', 'http-server']),
		demo(gulp, { local: true })
	])
	.then(function(results) {
		token = results[0].stdout ? results[0].stdout.trim() : results[0].trim();
		commit = results[1].stdout.trim();
		appName = appName + commit.substr(0, 5);
		return haikro.create({
			app: appName,
			region: 'eu',
			// organization: 'financial-times',
			token: token
		});
	})
	.then(function() {
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
	.then(function() {
		config.testUrl = config.testUrl || 'https://' + appName + '.herokuapp.com';
		return module.exports._runBrowserTest(config);
	})
	.then(function(app) {
		return haikro.destroy({
			token: token,
			app: appName
		});
	})
	.then(function(output) {
		log.secondary(output.stdout);
		fs.unlink('Procfile');
	})
	.catch(function(e) {
		if (e.stderr) {
			log.secondaryError(e.stderr);
			log.secondary(e.stdout);
		}
		log.secondaryError(e);
		process.exit(1);
	});
};

module.exports.watchable = true;
module.exports.description = 'Test if Sass silent compilation follows the Origami specification';
