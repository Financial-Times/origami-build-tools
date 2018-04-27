'use strict';

const fs = require('fs');
const path = require('path');
const extend = require('node.extend');
const log = require('../helpers/log');
const files = require('../helpers/files');
const build = require('../tasks/build');
const merge = require('merge-stream');
const through = require('through2');
const combine = require('stream-combiner2');
const gutil = require('gulp-util');
const mustache = require('gulp-mustache');
const rename = require('gulp-rename');
const webserver = require('gulp-webserver');
const portfinder = require('portfinder');
portfinder.basePort = 8080;

const builtFiles = {};
const defaultDemoConfig = {
	documentClasses: '',
	description: ''
};
let server;

function buildSass(gulp, buildConfig) {
	const src = path.join(buildConfig.cwd, '/' + buildConfig.demo.sass);
	const dest = path.join(buildConfig.cwd, '/demos/local/');
	if (builtFiles.css.indexOf(src) === -1) {
		if (!fs.existsSync(src)) {
			throw new Error('Sass file not found: ' + src);
		}

		const bowerConfig = files.getBowerJson();
		let prefixSass = '';
		// If module has o-assets as a dependency, set local demos to use local assets
		// to use the latest ones in the repo
		if (bowerConfig && bowerConfig.dependencies && bowerConfig.dependencies['o-assets']) {
			const moduleName = bowerConfig.name;
			prefixSass = '@import \'o-assets/main\';\n' +
				'@include oAssetsSetModulePaths((' + moduleName + ': ""));\n';
		}

		builtFiles.css.push(src);

		const sassConfig = {
			sass: src,
			sassPrefix: prefixSass,
			// For the Sass files to load correctly, they need to be in one of these two directories.
			// Sass doesn't look in subdirectories and we can't use wildcards
			sassIncludePaths: ['demos/src', 'demos/src/scss'],
			sourcemaps: true,
			buildCss: path.basename(buildConfig.demo.sass).replace('.scss', '.css'),
			buildFolder: dest
		};

		return build.sass(gulp, sassConfig);
	}
}

function buildJs(gulp, buildConfig) {
	const src = path.join(buildConfig.cwd, '/' + buildConfig.demo.js);
	const destFolder = path.join(buildConfig.cwd, '/demos/local/');
	const dest = path.basename(buildConfig.demo.js);
	if (builtFiles.js.indexOf(src) === -1) {
		if (!fs.existsSync(src)) {
			throw new Error('JavaScript file not found: ' + src);
		}

		builtFiles.js.push(src);

		const jsConfig = {
			js: src,
			buildFolder: destFolder,
			buildJs: dest,
			sourcemaps: true
		};

		return build.js(gulp, jsConfig);
	}
}

function buildHtml(gulp, buildConfig) {
	const src = path.join(buildConfig.cwd, '/' + buildConfig.demo.template);
	const partialsDir = path.dirname(src);
	const dest = 'demos/' + (buildConfig.staticSource !== 'dist' ? 'local/' : '');
	const destName = buildConfig.demo.name + '.html';
	let data = {};

	if (!fs.existsSync(src)) {
		return errorStream(merge(), 'Demo template not found: ' + src);
	}

	if (typeof buildConfig.demo.data === 'string') {
		const dataPath = path.join(buildConfig.cwd, '/' + buildConfig.demo.data);
		if (fs.existsSync(dataPath)) {
			const fileData = require(dataPath);
			if (typeof fileData === 'function') {
				data = fileData();
			} else {
				// assume object
				data = extend({}, fileData);
			}
		}
	} else if (typeof buildConfig.demo.data === 'object') {
		data = buildConfig.demo.data;
	}

	data.oDemoTitle = files.getModuleName(buildConfig.cwd) + ': ' + buildConfig.demo.name + ' demo';
	data.oDemoStyle = getStylesheetTags(buildConfig.demo.sass, buildConfig.demo.dependencies, buildConfig.staticSource, buildConfig.cwd, buildConfig.demo.brand);
	data.oDemoScript = getScriptTags(buildConfig.demo.js, buildConfig.demo.dependencies, buildConfig.staticSource, buildConfig.cwd);
	data.oDemoDocumentClasses = buildConfig.demo.documentClasses || buildConfig.demo.bodyClasses;
	data.oDemoTpl = fs.readFileSync(src, {encoding: 'utf8'});

	log.secondary('Rendering: ' + dest + destName);

	const origamiJsonPath = path.join(buildConfig.cwd, 'origami.json');
	const origamiJsonFile = fs.readFileSync(origamiJsonPath, { encoding: 'utf8' });

	let origamiJson;
	try {
		origamiJson = JSON.parse(origamiJsonFile);
	} catch(e) {
		throw e + ' in ' + origamiJsonPath;
	}

	let browserFeatures = [];
	if (origamiJson.browserFeatures) {
		browserFeatures = browserFeatures
			.concat(origamiJson.browserFeatures.required || [])
			.concat(origamiJson.browserFeatures.optional || []);
	}
	browserFeatures.push('default');
	data.oDemoBrowserFeatures = browserFeatures;

	const partials = loadPartials(partialsDir);

	return combine.obj(
		gulp.src(path.join(__dirname, '/../../templates/page.mustache')),
		mustache(data, null, partials),
		// We run mustache twice so that variables that affect the template are also compiled.
		// Another option would be to replace {{{oDemoTpl}}} with the template, and then
		// run mustache, but that would require another gulp plugin and shouldn't be too much more efficient
		mustache(data, null, partials),
		rename(destName),
		gulp.dest(path.join(buildConfig.cwd, dest))
	);
}

function loadPartials(partialsDir) {
	const partials = {};

	// Get a list of all mustache files in a directory
	files.getMustacheFilesList(partialsDir).forEach(filePath => {

		// Calculate the partial name, which is what is used
		// to refer to it in a template. We remove the base directory,
		// replace any preceeding slashes, and remove the extension.
		const partialName = filePath.replace(partialsDir, '').replace(/^\//, '').replace(/\.mustache$/i, '');

		// Add the name/content pair to the partials map
		partials[partialName] = fs.readFileSync(filePath, {encoding: 'utf8'});
	});

	return partials;
}

function getStylesheetTags(sassPath, dependencies, staticSource, cwd, brand) {
	let stylesheets = '';
	if (staticSource === 'dist') {
		stylesheets += '<link rel="stylesheet" href="/v2/bundles/css?modules=';
		if (sassPath) {
			stylesheets +=	files.getModuleName(cwd) +
				((sassPath !== 'main.scss') ? ':/' + sassPath : '');
		}
		if (dependencies) {
			stylesheets += ',' + dependencies.toString();
		}
		if (brand) {
			stylesheets += '&brand=' + brand;
		}
		stylesheets += '" />';

	} else {
		if (dependencies) {
			stylesheets += '<link rel="stylesheet" href="https://origami-build.ft.com/v2/bundles/css?modules=' + dependencies.toString() + '" />\n\t';
		}
		if (sassPath) {
			stylesheets += '<link rel="stylesheet" href="' + path.basename(sassPath).replace('.scss', '.css') + '" />';
		}
	}
	return stylesheets;
}

function getScriptTags(scriptPath, dependencies, staticSource, cwd) {
	let scripts = '';
	if (staticSource === 'dist') {
		scripts += '<script src="/v2/bundles/js?modules=';
		if (scriptPath) {
			scripts += files.getModuleName(cwd) +
				((scriptPath !== 'main.js') ? ':/' + scriptPath : '');
		}
		if (dependencies) {
			scripts += ',' + dependencies.toString();
		}
		scripts += '"></script>';
	} else {
		if (dependencies) {
			scripts += '<script src="https://origami-build.ft.com/v2/bundles/js?modules=' + dependencies.toString() + '"></script>\n\t';
		}
		if (scriptPath) {
			scripts += '<script src="' + path.basename(scriptPath) + '"></script>';
		}

	}
	return scripts;
}

function hasUniqueNames(demos) {
	const names = {};
	for (let i = 0; i < demos.length; i++) {
		if (names[demos[i].name]) {
			return false;
		}
		names[demos[i].name] = true;
	}
	return true;
}

// Helper function to throw an error on a stream that doesn't occur
// during it's pipeline
function errorStream(stream, errorMessage) {
	const errorStream = through(function(file, enc, cb) {
		const error = new gutil.PluginError('obt demo', {
			message: errorMessage,
			showStack: true
		});

		// Callback indicates the transformation is done and emits the error
		cb(error);
	});

	// Stream might not have anything written to it, so we write
	// an empty stream so it has something to pipe to errorStream
	stream.write('');
	// Combined stream helps forward the error handling to
	// error events attached to it
	const combined = combine.obj(
		stream,
		errorStream
	);

	return combined;
}

module.exports = function(gulp, config) {
	config = config || {};

	const cwd = config.cwd || process.cwd();

	// We also support the legacy config.json and config.js so the build service
	// can keep on compiling demos of older versions of modules
	let configPaths = [
		'demos/src/config.json',
		'origami.json'
	];
	let configPath;

	if (config.demoConfig) {
		configPaths = [config.demoConfig];
	}

	for (let i = 0, l = configPaths.length; i < l; i++) {
		const absoluteConfigPath = path.join(cwd, configPaths[i]);
		if (fs.existsSync(absoluteConfigPath)) {
			configPath = absoluteConfigPath;
			break;
		}
	}

	const demoStream = merge();

	if (configPath) {
		log.primary('Building' + (config.dist ? ' build service' : ' local') + ' demos (config: ' + configPath + ')');

		let demosConfig;

		try {
			demosConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
		} catch (error) {
			const demoConfigError = `${configPath} is not valid JSON.`;
			const demoConfigErrorStream = errorStream(demoStream, demoConfigError);
			return demoConfigErrorStream;
		}

		const demos = [];
		builtFiles.css = [];
		builtFiles.js = [];

		// Adds support for really old demos config structure, where it was an object instead of an array
		if (!Array.isArray(demosConfig.demos)) {
			// Currently compat only has this function, so only require if necessary
			const compat = require('../helpers/compat');
			demosConfig.demos = compat.convertToNewFormat(demosConfig.demos);
		}

		if (!hasUniqueNames(demosConfig.demos)) {
			const demoConfigError = 'Demos with the same name were found. Give them unique names and try again.';
			const demoConfigErrorStream = errorStream(demoStream, demoConfigError);
			return demoConfigErrorStream;
		}

		if (typeof config.demoFilter === 'string') {
			config.demoFilter = config.demoFilter.split(',');
		}

		if (!configPath.includes('origami.json')) {
			log.primary('Please move your demo config into origami.json following the spec: http://origami.ft.com/docs/syntax/origamijson');
		}

		demosConfig.demos.forEach(function(demoConfig) {
			if (!config.demoFilter || (config.demoFilter && config.demoFilter.indexOf(demoConfig.name) !== -1)) {
				// Extend an empty object to avoid changing the value of defaultDemoConfig
				demos.push(extend(true, {}, defaultDemoConfig, demosConfig.demosDefaults || demosConfig.options, demoConfig));
			}
		});

		if (demos.length === 0) {
			let noDemosError = 'No demos were found';
			if (config.demoFilter) {
				noDemosError += ' for ' + config.demoFilter;
			}
			noDemosError += '.';

			const noDemosErrorStream = errorStream(demoStream, noDemosError);
			return noDemosErrorStream;
		}

		const emitDemoStreamErrorEvent = demoStream.emit.bind(demoStream, 'error');
		demos.map(function(demo) {
			log.secondary('Building demo ' + demo.name);

			if (config.brand) {
				demo.brand = config.brand;
			}

			const buildConfig = {
				demo: demo,
				cwd: cwd
			};

			if (config.dist) {
				buildConfig.staticSource = 'dist';
				demoStream.add(buildHtml(gulp, buildConfig)
					.on('error', emitDemoStreamErrorEvent));
			} else {
				const htmlLocalStream = buildHtml(gulp, buildConfig)
					.on('error', emitDemoStreamErrorEvent);
				demoStream.add(htmlLocalStream);

				if (demo.sass && (typeof config.watching === 'undefined' || config.watching === 'sass')) {
					const sassStream = buildSass(gulp, buildConfig);
					if (sassStream) {
						sassStream
							.on('error', emitDemoStreamErrorEvent);
						demoStream.add(sassStream);
					}
				}

				if (demo.js && (typeof config.watching === 'undefined' || config.watching === 'js')) {
					const jsStream = buildJs(gulp, buildConfig);
					if (jsStream) {
						jsStream
							.on('error', emitDemoStreamErrorEvent);
						demoStream.add(jsStream);
					}
				}
			}
		});

		if (config.runServer) {
			demoStream.on('end', function() {
				module.exports.runServer(gulp, config);
			});
		}

		return demoStream;
	} else {
		const configError = 'Couldn\'t find demos config path, checked: ' + configPaths.reverse();
		const configErrorStream = errorStream(demoStream, configError);
		return configErrorStream;
	}
};

module.exports.runServer = function(gulp, config) {
	return new Promise(function(resolve, reject) {
		portfinder.getPorts(2, function (err, ports) {
			if (err) {
				reject(err);
				return;
			}

			if (server) {
				resolve(server);
				return;
			}

			config = config || {};

			log.primary('Open http://localhost:' + ports[0] + '/demos/local/ in a browser to view the demos');

			server = gulp.src('.')
				.pipe(webserver({
					directoryListing: true,
					port: ports[0],
					host: '0.0.0.0',
					livereload: (config.livereload === false || config.livereload === 'false') ? false : {enable: true, port: ports[1]}
				}));
			resolve(server);
		});
	});
};

module.exports.watchable = true;
module.exports.description = 'Build demos into the demos/ directory';
