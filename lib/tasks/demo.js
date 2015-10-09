'use strict';

const fs = require('fs');
const path = require('path');
const extend = require('node.extend');
const log = require('../helpers/log');
const files = require('../helpers/files');
const build = require('../tasks/build');
const mustache = require('gulp-mustache');
const rename = require('gulp-rename');
const webserver = require('gulp-webserver');
const portfinder = require('portfinder');
portfinder.basePort = 8080;

const builtFiles = {};
const defaultDemoConfig = {
	documentClasses: '',
	description: '',
	expanded: true
};
let server;

function buildSass(gulp, demoConfig) {
	return new Promise(function(resolve, reject) {
		const src = path.join(process.cwd(), '/' + demoConfig.sass);
		const dest = path.join(process.cwd(), '/demos/local/');
		if (builtFiles.css.indexOf(src) === -1) {
			if (!fs.existsSync(src)) {
				throw new Error('Sass file not found: ' + src);
			}

			const bowerConfig = files.getBowerJson();
			let prefixSass = '';
			// If module has o-assets as a dependency, set local demos to use local assets
			if (bowerConfig.dependencies && bowerConfig.dependencies['o-assets']) {
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
				buildCss: path.basename(demoConfig.sass).replace('.scss', '.css'),
				buildFolder: dest
			};

			return build.sass(gulp, sassConfig)
				.on('error', reject)
				.on('end', resolve);
		} else {
			resolve();
		}
	});
}

function buildJs(gulp, demoConfig) {
	return new Promise(function(resolve, reject) {
		const src = path.join(process.cwd(), '/' + demoConfig.js);
		const destFolder = path.join(process.cwd(), '/demos/local/');
		const dest = path.basename(demoConfig.js);
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

			build.js(gulp, jsConfig)
				.on('error', reject)
				.on('end', resolve);
		} else {
			resolve();
		}
	});
}

function buildHtml(gulp, demoConfig, staticSource) {
	return new Promise(function(resolve, reject) {
		const src = path.join(process.cwd(), '/' + demoConfig.template);
		const dest = 'demos/' + (staticSource === 'local' ? 'local/' : '');
		const destName = demoConfig.name + '.html';
		let data = {};
		if (!fs.existsSync(src)) {
			throw new Error('Demo template not found: ' + src);
		}
		if (typeof demoConfig.data === 'string') {
			const dataPath = path.join(process.cwd(), '/' + demoConfig.data);
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
		data.oDemoDocumentClasses = demoConfig.documentClasses || demoConfig.bodyClasses;
		data.oDemoTpl = fs.readFileSync(src, {encoding: 'utf8'});

		log.secondary('Rendering: ' + dest + destName);

		const origamiJsonPath = path.join(process.cwd(), 'origami.json');
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
		gulp.src(path.join(__dirname, '/../../templates/page.mustache'))
			.pipe(mustache(data))
			// We run mustache twice so that variables that affect the template are also compiled.
			// Another option would be to replace {{{oDemoTpl}}} with the template, and then
			// run mustache, but that would require another gulp plugin and shouldn't be too much more efficient
			.pipe(mustache(data))
			.pipe(rename(destName))
			.pipe(gulp.dest(dest))
			.on('error', reject)
			.on('end', resolve);
	});
}

function getStylesheetTags(sassPath, dependencies, staticSource) {
	let stylesheets = '';
	if (staticSource === 'local') {
		if (dependencies) {
			stylesheets += '<link rel="stylesheet" href="//build.origami.ft.com/bundles/css?modules=' + dependencies.toString() + '" />\n\t';
		}
		stylesheets += '<link rel="stylesheet" href="' + path.basename(sassPath).replace('.scss', '.css') + '" />';
	} else {
		stylesheets += '<link rel="stylesheet" href="/bundles/css?modules=' + files.getModuleName() + ((sassPath !== 'main.scss') ? ':/' + sassPath : '') + (dependencies ? ',' + dependencies.toString() : '') + '" />';
	}
	return stylesheets;
}

function getScriptTags(scriptPath, dependencies, staticSource) {
	let scripts = '';
	if (staticSource === 'local') {
		if (dependencies) {
			scripts += '<script src="//build.origami.ft.com/bundles/js?modules=' + dependencies.toString() + '"></script>\n\t';
		}
		scripts += '<script src="' + path.basename(scriptPath) + '"></script>';
	} else {
		scripts += '<script src="/bundles/js?modules=' + files.getModuleName() + ((scriptPath !== 'main.js') ? ':/' + scriptPath : '') + (dependencies ? ',' + dependencies.toString() : '') + '"></script>';
	}
	return scripts;
}

function convertToNewFormat(demosConfig) {
	const demoArray = [];
	let demoConfig;
	for (const demoName in demosConfig) {
		if (demosConfig.hasOwnProperty(demoName)) {
			demoConfig = demosConfig[demoName];
			demoConfig.name = demoName;
			demoArray.push(demoConfig);
		}
	}
	return demoArray;
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

function updateOrigamiJsonDemoList(demosBuilt) {
	const origamiDemoConfig = demosBuilt.map(function(conf) {

		return {
			path: path.join('/demos/', conf.name + '.html'),
			expanded: conf.expanded,
			description: conf.description
		};
	});

	if (origamiDemoConfig.length > 0) {
		const origamiJsonPath = path.join(process.cwd(), 'origami.json');
		const origamiJsonFile = fs.readFileSync(origamiJsonPath, { encoding: 'utf8' });
		let origamiJson = JSON.parse(origamiJsonFile);
		origamiJson.demos = origamiDemoConfig;
		origamiJson = JSON.stringify(origamiJson, null, 4);
		fs.writeFileSync(origamiJsonPath, origamiJson, { encoding: 'utf8' });
	}
}

module.exports = function(gulp, config) {
	config = config || {};

	config.local = config.runServer ? config.runServer : config.local;

	let configPaths = ['demos/src/config.json', 'demos/src/config.js', 'origami.json'];
	let configPath;

	if (config.demoConfig) {
		configPaths = [config.demoConfig];
	}

	for (let i = 0, l = configPaths.length; i < l; i++) {
		if (fs.existsSync(configPaths[i])) {
			configPath = configPaths[i];
			break;
		}
	}

	if (configPath) {
		log.primary('Building' + (config.local ? ' local and' : '') + ' build service demos (config: ' + configPath + ')');

		const demosConfig = require(path.join(process.cwd(), '/' + configPath));
		const demos = [];
		builtFiles.css = [];
		builtFiles.js = [];

		if (!Array.isArray(demosConfig.demos)) {
			log.primary('WARNING: Deprecated demo config format. Generating the new format...');
			demosConfig.demos = convertToNewFormat(demosConfig.demos);
			log.secondary(JSON.stringify(demosConfig.demos, null, 2));
			log.primary('Copy and paste this config into the \'demos\' key in origami.json');
			log.primary('Full documentation: http://origami.ft.com/docs/component-spec/modules/#demo-config-file');
		}

		if (!hasUniqueNames(demosConfig.demos)) {
			const demoConfigError = 'Demos with the same name were found. Give them unique names and try again.';
			log.primaryError(demoConfigError);
			return Promise.reject(demoConfigError);
		}

		demosConfig.demos.forEach(function(demoConfig) {
			if (!config.buildDemo || (config.buildDemo && config.buildDemo === demoConfig.name)) {
				// Extend an empty object to avoid changing the value of defaultDemoConfig
				demos.push(extend(true, {}, defaultDemoConfig, demosConfig.demosDefaults || demosConfig.options, demoConfig));
			}
		});

		// TODO: Path won't be needed once build service endpoint is set up
		// updateOrigamiJsonDemoList needs to be kept for backwards compatibility
		if (configPath === 'origami.json') {
			demosConfig.demos.map(function(conf) {
				conf.path = path.join('/demos/', conf.name + '.html');
				return conf;
			});

			const origamiJson = JSON.stringify(demosConfig, null, 4);
			fs.writeFileSync(path.join(process.cwd(), '/' + configPath), origamiJson, { encoding: 'utf8' });
		} else if (config.updateorigami) {
			log.primary('Updating origami.json demo list...');
			updateOrigamiJsonDemoList(demos);
		}


		let promise = Promise.all(demos.map(function(demo) {
			log.secondary('Building demo ' + demo.name);

			return buildHtml(gulp, demo, 'buildservice')
				.then(function() {
					if (config.local) {
						const localBuilds = [buildHtml(gulp, demo, 'local')];
						if (demo.sass && (typeof config.watching === 'undefined' || config.watching === 'sass')) {
							localBuilds.push(buildSass(gulp, demo));
						}
						if (demo.js && (typeof config.watching === 'undefined' || config.watching === 'js')) {
							localBuilds.push(buildJs(gulp, demo));
						}
						return Promise.all(localBuilds);
					}
				});
		}));

		if (config.runServer) {
			promise = promise.then(function() {
				module.exports.runServer(gulp, config);
			});
		}

		return promise;
	} else {
		const configError = 'Couldn\'t find demos config path, checked: ' + configPaths;
		log.primaryError(configError);
		return Promise.reject(configError);
	}
};

module.exports.runServer = function(gulp, config) {
	return new Promise(function(resolve, reject) {
		portfinder.getPort(function (err, port) {
			if (err) {
				reject(err);
				return;
			}

			if (server) {
				resolve(server);
				return;
			}

			config = config || {};

			log.primary('Open http://localhost:' + port + '/demos/local/ in a browser to view the demos');

			server = gulp.src('.')
				.pipe(webserver({
					directoryListing: true,
					port: port,
					host: '0.0.0.0',
					livereload: (config.livereload === false || config.livereload === 'false') ? false : true
				}));
			resolve(server);
		});
	});
};

module.exports.watchable = true;
module.exports.description = 'Build demos into the demos/ directory';
