'use strict';

var fs = require('fs');
var path = require('path');
var sass = require('gulp-ruby-sass');
var mustache = require('gulp-mustache');
var source = require('vinyl-source-stream');
var rename = require('gulp-rename');
var webserver = require('gulp-webserver');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var browserify = require('browserify');
var extend = require('node.extend');
var log = require('../helpers/log.js');
var files = require('../helpers/files.js');
var textrequireify = require('textrequireify');
var debowerify = require('debowerify');
var babelify = require('babelify');

var builtFiles = {};
var defaultDemoConfig = {
	bodyClasses: "",
	description: "",
	expanded: true
};
var server;

function buildSass(gulp, demoConfig) {
	return new Promise(function(resolve, reject) {
		var src = path.join(process.cwd(), '/' + demoConfig.sass);
		var dest = path.join(process.cwd(), '/demos/local/');
		if (builtFiles.css.indexOf(src) === -1) {
			if (!fs.existsSync(src)) {
				throw new Error("Sass file not found: " + src);
			}

			log.secondary("Compiling Sass: " + demoConfig.sass);

			var bowerConfig = files.getBowerJson(),
				prefixSass = '';
			// If module has o-assets as a dependency, set local demos to use local assets
			if (bowerConfig.dependencies && bowerConfig.dependencies['o-assets']) {
				var moduleName = bowerConfig.name;
				prefixSass = '@import "o-assets/main";\n'+
					'@include oAssetsSetModulePaths(('+moduleName+': ""));\n';
			}

			builtFiles.css.push(src);

			var sassContent = fs.readFileSync(src, 'utf8');
			var tmpSrc = src.replace('.scss', '.tmp.scss');
			fs.writeFileSync(tmpSrc, prefixSass + sassContent, 'utf8');

			// TODO: Maybe reuse tasks.build.sass?
			sass(tmpSrc, {
					// For the Sass files to load correctly, they need to be in one of these two directories.
					// Sass doesn't look in subdirectories and we can't use wildcards
					loadPath: ['demos/src', 'demos/src/scss', 'bower_components'],
					sourcemap: true
				})
				.on('error', reject)
				.pipe(sourcemaps.init({loadMaps: true}))
				.pipe(autoprefixer({browsers: ['> 1%', 'last 2 versions', 'ie > 6', 'ff ESR'], cascade: false}))
				.pipe(sourcemaps.write())
				// Makes sure the output file doesn't contain '.tmp' in its name
				.pipe(rename(path.basename(demoConfig.sass).replace('.scss', '.css')))
				.pipe(gulp.dest(dest))
				.on('end', function() {
					fs.unlink(tmpSrc);
					resolve();
				});
		} else {
			resolve();
		}
	});
}

function buildJs(gulp, demoConfig) {
	return new Promise(function(resolve, reject) {
		var src = path.join(process.cwd(), '/' + demoConfig.js);
		var destFolder = path.join(process.cwd(), '/demos/local/');
		var dest = path.basename(demoConfig.js);
		if (builtFiles.js.indexOf(src) === -1) {
			if (!fs.existsSync(src)) {
				throw new Error("JavaScript file not found: " + src);
			}
			log.secondary("Browserifying: " + demoConfig.js);
			builtFiles.js.push(src);

			// TODO: Maybe reuse tasks.build.js?
			browserify({debug: true})
				.on('error', reject)
				.add(src)
				.require(src, { entry: true })
				.transform(debowerify)
				.transform(textrequireify)
				.transform(babelify)
				.bundle()
				.pipe(source(dest))
				.pipe(gulp.dest(destFolder))
				.on('end', function() {
					resolve();
				});
		} else {
			resolve();
		}
	});
}

function buildHtml(gulp, demoConfig, staticSource) {
	return new Promise(function(resolve, reject) {
		var src = path.join(process.cwd(), '/' + demoConfig.template);
		var dest = 'demos/' + (staticSource === 'local' ? 'local/' : '');
		var destName = demoConfig.name + '.html';
		var data = {};
		if (!fs.existsSync(src)) {
			throw new Error("Demo template not found: " + src);
		}
		if (typeof demoConfig.data === 'string') {
			var dataPath = path.join(process.cwd(), '/' + demoConfig.data);
			if (fs.existsSync(dataPath)) {
				data = JSON.parse(fs.readFileSync(dataPath));
			}
		} else if (typeof demoConfig.data === 'object') {
			data = demoConfig.data;
		}
		data.oDemoTitle = files.getModuleName() + ': ' + demoConfig.name + ' demo';
		if (demoConfig.sass) {
			data.oDemoStyle = getStylesheetTags(demoConfig.sass, demoConfig.dependencies, staticSource);
		}
		if (demoConfig.js) {
			data.oDemoScript = getScriptTags(demoConfig.js, demoConfig.dependencies, staticSource);
		}
		data.oDemoBodyClasses = demoConfig.bodyClasses;
		data.oDemoTpl = fs.readFileSync(src, {encoding: 'utf8'});
		log.secondary("Rendering: " + dest + destName);
		if (staticSource !== 'local') {
			demoConfig.outputHtmlPath = dest + destName;
		}
		var origamiJsonPath = path.join(process.cwd(), 'origami.json');
		var origamiJsonFile = fs.readFileSync(origamiJsonPath, { encoding: 'utf8' });
		var origamiJson = JSON.parse(origamiJsonFile);
		var browserFeatures = [];
		if (origamiJson.browserFeatures) {
			browserFeatures = browserFeatures
				.concat(origamiJson.browserFeatures.required || [])
				.concat(origamiJson.browserFeatures.optional || [])
				.map(function(feature) {
					return "modernizr:" + feature;
				});
		}
		browserFeatures.push('default');
		data.oDemoBrowserFeatures = browserFeatures;
		gulp.src(path.join(__dirname, '/../../templates/page.mustache'))
			.pipe(mustache(data))
			// We run mustache twice so that variables that affect the template are also compiled.
			// Another option would be to replace {{{oDemoTpl}}} with the template, and then
			// run mustache, but that would require another gulp plugin and shouldn't be too much more efficient
			.pipe(mustache(data))
			.pipe(rename(destName))
			.pipe(gulp.dest(dest))
			.on('error', reject)
			.on('end', function() {
				resolve();
			});
	});
}

function getStylesheetTags(sassPath, dependencies, staticSource) {
	var stylesheets = '';
	if (staticSource === 'local') {
		if (dependencies) {
			stylesheets += '<link rel="stylesheet" href="//build.origami.ft.com/bundles/css?modules=' + dependencies.toString() + '" />\n\t';
		}
		stylesheets += '<link rel="stylesheet" href="' + path.basename(sassPath).replace('.scss', '.css') + '" />';
	} else {
		stylesheets += '<link rel="stylesheet" href="/bundles/css?modules=' + files.getModuleName() + ((sassPath !== "main.scss") ? ':/' + sassPath : '') + (dependencies ?  ',' + dependencies.toString() : '') + '" />';
	}
	return stylesheets;
}

function getScriptTags(scriptPath, dependencies, staticSource) {
	var scripts = '';
	if (staticSource === 'local') {
		if (dependencies) {
			scripts += '<script src="//build.origami.ft.com/bundles/js?modules=' + dependencies.toString() + '"></script>\n\t';
		}
		scripts += '<script src="' + path.basename(scriptPath) + '"></script>';
	} else {
		scripts += '<script src="/bundles/js?modules=' + files.getModuleName() + ((scriptPath !== "main.js") ? ':/' + scriptPath : '') + (dependencies ?  ',' + dependencies.toString() : '') + '"></script>';
	}
	return scripts;
}

function convertToNewFormat(demosConfig) {
	var demoArray = [];
	var demoConfig;
	for (var demoName in demosConfig) {
		if (demosConfig.hasOwnProperty(demoName)) {
			demoConfig = demosConfig[demoName];
			demoConfig.name = demoName;
			demoArray.push(demoConfig);
		}
	}
	return demoArray;
}

function hasUniqueNames(demos) {
	var names = {};
	for (var i = 0; i < demos.length; i++) {
		if (names[demos[i].name]) {
			return false;
		}
		names[demos[i].name] = true;
	}
	return true;
}

function updateOrigamiJsonDemoList(demosBuilt) {
	var origamiDemoConfig = demosBuilt.map(function(conf) {
		return {
			path: "/" + conf.outputHtmlPath,
			expanded: conf.expanded,
			description: conf.description
		};
	});

	if (origamiDemoConfig.length > 0) {
		var origamiJsonPath = path.join(process.cwd(), 'origami.json');
		var origamiJsonFile = fs.readFileSync(origamiJsonPath, { encoding: 'utf8' });
		var origamiJson = JSON.parse(origamiJsonFile);
		origamiJson.demos = origamiDemoConfig;
		origamiJson = JSON.stringify(origamiJson, null, 4);
		fs.writeFileSync(origamiJsonPath, origamiJson, { encoding: 'utf8' });
	}
}

module.exports = function(gulp, config) {
	if (!files.bowerJsonExists()) {
		var bowerError = 'Couldn\'t find a bower.json file. Please add one and try again';
		log.primaryError(bowerError);
		return Promise.reject(bowerError);
	}
	config = config || {};
	var configPath;
	var configPaths = ["demos/src/config.json", "demos/src/config.js"];

	if (config.demoConfig) {
		configPaths = [config.demoConfig];
	}
	for (var i = 0, l = configPaths.length; i < l; i++) {
		if (fs.existsSync(configPaths[i])) {
			configPath = configPaths[i];
			break;
		}
	}
	if (configPath) {
		log.primary("Building" + (config.local ? " local and" : "") + " build service demos (config: " + configPath + ')');

		var demosConfig = require(path.join(process.cwd(), '/' + configPath));
		var demos = [];
		builtFiles.css = [];
		builtFiles.js = [];

		if (!Array.isArray(demosConfig.demos)) {
			log.primary('WARNING: Deprecated demo config format. Generating the new format...');
			demosConfig.demos = convertToNewFormat(demosConfig.demos);
			log.secondary(JSON.stringify(demosConfig.demos, null, 2));
			log.primary('Copy and paste this config into the "demos" key in demos/src/config.json');
			log.primary('Full documentation: http://origami.ft.com/docs/component-spec/modules/#demo-config-file');
		}

		if (!hasUniqueNames(demosConfig.demos)) {
			var demoConfigError = 'Demos with the same name were found. Give them unique names and try again.';
			log.primaryError(demoConfigError);
			return Promise.reject(demoConfigError);
		}

		demosConfig.demos.forEach(function(demoConfig) {
			// Extend an empty object to avoid changing the value of defaultDemoConfig
			demos.push(extend(true, {}, defaultDemoConfig, demosConfig.options, demoConfig));
		});

		var promise = Promise.all(demos.map(function(demo) {
			log.secondary('Building demo ' + demo.name);

			return buildHtml(gulp, demo, 'buildservice')
				.then(function() {
					if (config.local) {
						var localBuilds = [buildHtml(gulp, demo, 'local')];
						if (demo.sass) {
							localBuilds.push(buildSass(gulp, demo));
						}
						if (demo.js) {
							localBuilds.push(buildJs(gulp, demo));
						}
						return Promise.all(localBuilds);
					}
				});
		}));

		if (!config.updateorigami) {
			log.secondary('Tip: Add --updateorigami to automatically update origami.json with new demo metadata');
		} else {
			log.primary('Updating origami.json demo list...');
			updateOrigamiJsonDemoList(demos);
		}

		if (config.local) {
			promise = promise.then(function() {
				module.exports.runServer(gulp);
			});
		}

		return promise.catch(function(err) {
			log.primaryError(err);
			throw err;
		});
	} else {
		var configError = 'Couldn\'t find demos config path, checked: ' + configPaths;
		log.primaryError(configError);
		return Promise.reject(configError);
	}
};

module.exports.runServer = function(gulp) {
	return new Promise(function(resolve, reject) {
		var portfinder = require('portfinder');
		portfinder.basePort = 8080;
		portfinder.getPort(function (err, port) {
			if (err) {
				reject(err);
			}
			if (server) {
				server.emit('kill');
			}
			log.primary('Open http://localhost:'+port+'/demos/local/ in a browser to view the demos');
			server = gulp.src('.')
				.pipe(webserver({
					directoryListing: true,
					port: port,
					host: '0.0.0.0'
				}));
			resolve(server);
		});
	});
};

module.exports.watchable = true;
module.exports.local = true;
module.exports.description = 'Build demos into the demos/ directory';
