'use strict';

var fs = require('fs'),
	path = require('path'),
	sass = require('gulp-ruby-sass'),
	mustache = require('gulp-mustache'),
	source = require('vinyl-source-stream'),
	rename = require('gulp-rename'),
	webserver = require('gulp-webserver'),
	browserify = require('browserify'),
	extend = require('node.extend'),
	prefixer = require('../plugins/gulp-prefixer.js'),
	log = require('../helpers/log.js'),
	files = require('../helpers/files.js'),
	builtFiles = {},
	defaultDemoConfig = {
		bodyClasses: "",
		description: "",
		expanded: true
	},
	server;

function buildSass(gulp, demoConfig) {
	var src = path.join(process.cwd(), '/' + demoConfig.sass),
		dest = path.join(process.cwd(), '/demos/local/');
	if (fs.existsSync(src) && builtFiles.css.indexOf(src) === -1) {
		log.secondary("Compiling SASS: " + demoConfig.sass);
		var bowerConfig = files.getBowerJson(),
			prefixSass = '';
		// If module has o-assets as a dependency, set local demos to use local assets
		if (bowerConfig.dependencies && bowerConfig.dependencies['o-assets']) {
			var moduleName = bowerConfig.name;
			prefixSass = '@import "o-assets/main";\n'+
				'@include oAssetsSetModulePaths(('+moduleName+': ""));\n';
		}
		builtFiles.css.push(src);
		return gulp.src(src)
			.pipe(prefixer(prefixSass))
			// For the SASS files to load correctly, they need to be in one of these two directories. SASS doesn't look in subdirectories and we can't use wildcards
			.pipe(sass({loadPath: ['demos/src', 'demos/src/scss', 'bower_components'], style: 'compressed'}))
			.on('error', function(err) { console.log(err.message);})
			.pipe(gulp.dest(dest));
	}
}

function buildJs(gulp, demoConfig) {
	var src = path.join(process.cwd(), '/' + demoConfig.js),
		destFolder = path.join(process.cwd(), '/demos/local/'),
		dest = path.basename(demoConfig.js);
	if (fs.existsSync(src) && builtFiles.js.indexOf(src) === -1) {
		log.secondary("Browserifying: " + demoConfig.js);
		builtFiles.js.push(src);
		return browserify(src)
			.require(src, {})
			.transform({}, 'debowerify')
			.transform({}, 'textrequireify')
			.bundle({debug: true})
			.pipe(source(dest))
			.pipe(gulp.dest(destFolder));
	}
}

function buildHtml(gulp, demoConfig, staticSource) {
	return new Promise(function(resolve) {
		var src = path.join(process.cwd(), '/' + demoConfig.template),
			dest = 'demos/' + (staticSource === 'local' ? 'local/' : ''),
			destName = demoConfig.name + '.html',
			data = {};
		if (fs.existsSync(src)) {
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
				data.oDemoStyle = '<link rel="stylesheet" href="' + getStylesheetHref(demoConfig.sass, staticSource) + '" />';
			}
			if (demoConfig.js) {
				data.oDemoScript = '<script src="' + getScriptSrc(demoConfig.js, staticSource) + '"></script>';
			}
			data.oDemoBodyClasses = demoConfig.bodyClasses;
			data.oDemoTpl = fs.readFileSync(src, {encoding: 'utf8'});
			log.secondary("Rendering: " + dest + destName);
			if (staticSource !== 'local') {
				demoConfig.outputHtmlPath = dest + destName;
			}
			return gulp.src(path.join(__dirname, '/../../templates/page.mustache'))
				.pipe(mustache(data))
				// We run mustache twice so that variables that affect the template are also compiled.
				// Another option would be to replace {{{oDemoTpl}}} with the template, and then
				// run mustache, but that would require another gulp plugin and shouldn't be too much more efficient
				.pipe(mustache(data))
				.pipe(rename(destName))
				.pipe(gulp.dest(dest))
				.on('end', function() {
					resolve();
				});
		}
	});
}

function getStylesheetHref(sassPath, staticSource) {
	if (staticSource === 'local') {
		return path.basename(sassPath).replace('.scss', '.css');
	} else {
		return '/bundles/css?modules=' + files.getModuleName() + ((sassPath !== "main.scss") ? ':/' + sassPath : '');
	}
}

function getScriptSrc(scriptPath, staticSource) {
	if (staticSource === 'local') {
		return path.basename(scriptPath);
	} else {
		return '/bundles/js?modules=' + files.getModuleName() + ((scriptPath !== "main.js") ? ':/' + scriptPath : '');
	}
}

function convertToNewFormat(demosConfig) {
	var demoArray = [],
		demoConfig;
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
		var origamiJsonPath = path.join(process.cwd(), 'origami.json'),
			origamiJsonFile = fs.readFileSync(origamiJsonPath, { encoding: 'utf8' }),
			origamiJson = JSON.parse(origamiJsonFile);
		origamiJson.demos = origamiDemoConfig;
		origamiJson = JSON.stringify(origamiJson, null, 4);
		fs.writeFileSync(origamiJsonPath, origamiJson, { encoding: 'utf8' });
	}
}

module.exports = function(gulp, config) {
	var configPaths = ["demos/src/config.json", "demos/src/config.js"];
	var configPath;
	config = config || {};

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

		var demosConfig = require(path.join(process.cwd(), '/' + configPath)),
			demos = [];
		builtFiles.css = [];
		builtFiles.js = [];

		if (!Array.isArray(demosConfig.demos)) {
			log.primary('WARNING: Deprecated demo config format. Demo task will run converting it to the new one...');
			demosConfig.demos = convertToNewFormat(demosConfig.demos);
		}

		if (!hasUniqueNames(demosConfig.demos)) {
			log.primaryError("Demo names are not unique. Can't build demos.");
			return;
		}

		demosConfig.demos.forEach(function(demoConfig) {
			// Extend an empty object to avoid changing the value of defaultDemoConfig
			demos.push(extend(true, {}, defaultDemoConfig, demosConfig.options, demoConfig));
		});

		demos.forEach(function(demo) {
			log.secondary('Building demo ' + demo.name);

			buildHtml(gulp, demo, 'buildservice')
				.then(function() {
					if (config.local) {
						buildHtml(gulp, demo, 'local');
						buildSass(gulp, demo);
						buildJs(gulp, demo);
					}
				});
		});

		if (!config.updateorigami) {
			log.secondary('Tip: Add --updateorigami to automatically update origami.json with new demo metadata');
		} else {
			log.primary('Updating origami.json demo list...');
			updateOrigamiJsonDemoList(demos);
		}

		if (config.local) {
			module.exports.runServer(gulp);
		}
	} else {
		log.secondaryError("Couldn't find demos config path, checked: " + configPaths);
	}
};

module.exports.runServer = function(gulp) {
	var portfinder = require('portfinder');
	portfinder.basePort = 8080;
	portfinder.getPort(function (err, port) {
		if (err) {
			throw err;
		}
		if (server) {
			server.emit('kill');
		}
		log.primary('Load in browser to view demos: http://localhost:'+port+'/demos/local/');
		server = gulp.src('.')
			.pipe(webserver({
				directoryListing: true,
				port: port
			}));
		return server;
	});
};

module.exports.watchable = true;
module.exports.description = 'Builds the demos';
