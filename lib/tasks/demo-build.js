'use strict';

const fs = require('fs-extra');
const path = require('path');
const extend = require('node.extend');
const files = require('../helpers/files');
const buildJs = require('../tasks/build-js');
const buildSass = require('../tasks/build-sass');
const mustache = require('mustache');
const denodeify = require('util').promisify;
const request = require('request-promise-native');

const fileExists = file => denodeify(fs.open)(file, 'r').then(() => true).catch(() => false);
const readFile = denodeify(fs.readFile);
const outputFile = denodeify(fs.outputFile);

function buildDemoSass(buildConfig) {
	const src = path.join(buildConfig.cwd, '/' + buildConfig.demo.sass);
	const dest = path.join(buildConfig.cwd, '/demos/local/');

	return fileExists(src)
		.then(exists => {
			if (!exists) {
				const e = new Error('Sass file not found: ' + src);
				e.stack = '';
				throw e;
			}
			return files.getBowerJson(buildConfig.cwd);
		})
		.then(bowerConfig => {
			let prefixSass = '';
			// If module has o-assets as a dependency, set local demos to use local assets
			// to use the latest ones in the repo
			if (bowerConfig && bowerConfig.dependencies && bowerConfig.dependencies['o-assets']) {
				const moduleName = bowerConfig.name;
				prefixSass = '@import \'o-assets/main\';\n' +
					'@include oAssetsSetModulePaths((' + moduleName + ': ""));\n';
			}

			const sassConfig = {
				sass: src,
				sassPrefix: prefixSass,
				// For the Sass files to load correctly, they need to be in one of these two directories.
				// Sass doesn't look in subdirectories and we can't use wildcards
				sassIncludePaths: ['demos/src', 'demos/src/scss'],
				sourcemaps: true,
				buildCss: path.basename(buildConfig.demo.sass).replace('.scss', '.css'),
				buildFolder: dest,
				cwd: buildConfig.cwd,
				brand: buildConfig.brand,
				verbose: buildConfig.verbose
			};

			return buildSass(sassConfig);
		});
}

function buildDemoJs(buildConfig) {
	const src = path.join(buildConfig.cwd, '/' + buildConfig.demo.js);
	const destFolder = path.join(buildConfig.cwd, '/demos/local/');
	const dest = path.basename(buildConfig.demo.js);
	return fileExists(src)
		.then(exists => {
			if (!exists) {
				const e = new Error('JavaScript file not found: ' + src);
				e.stack = '';
				throw e;
			}

			const jsConfig = {
				js: src,
				buildFolder: destFolder,
				buildJs: dest
			};

			return buildJs(jsConfig);
		});
}

function loadRemoteDemoData(url) {
	const genericErrorMessage = 'Could not load remote demo data.';
	return request.get({
		uri: url,
		json: true
	})
		.then(data => {
			if (typeof data === 'object') {
				return data;
			}
			const err = new Error(`${genericErrorMessage} ${url} did not provide valid JSON.`);
			err.stack = '';
			throw err;
		}).catch((err) => {
			if (err.name === 'RequestError') {
				err.message = `${genericErrorMessage} ${url} does not appear to be valid.`;
				err.stack = '';
			}
			if (err.name === 'StatusCodeError') {
			  err.message = `${genericErrorMessage} ${url} returned a ${err.statusCode} status code.`;
			  err.stack = '';
			}
			throw err;
		});
}

function loadLocalDemoData(dataPath) {
	return readFile(dataPath, 'utf-8')
		.then(file => {
			try {
				const fileData = JSON.parse(file);
				if (typeof fileData === 'object') {
					return fileData;
				} else {
					return {};
				}
			} catch (error) {
				const e = new Error(`${dataPath} is not valid JSON.`);
				e.stack = '';
				throw e;
			}
		})
		.catch(() => {
			const e = new Error(`Demo data not found: ${dataPath}`);
			e.stack = '';
			throw e;
		});
}

function loadDemoData(buildConfig) {
	if (typeof buildConfig.demo.data === 'string') {
		const dataPathIsRemote = /^(?:https?:)\/\//.test(buildConfig.demo.data);
		const dataPath = dataPathIsRemote ? buildConfig.demo.data : path.join(buildConfig.cwd, '/' + buildConfig.demo.data);
		if (dataPathIsRemote) {
			return loadRemoteDemoData(dataPath);
		} else {
			return loadLocalDemoData(dataPath);
		}
	} else if (typeof buildConfig.demo.data === 'object') {
		return Promise.resolve(buildConfig.demo.data);
	} else {
		return Promise.resolve({});
	}
}

function buildDemoHtml(buildConfig) {
	const src = path.join(buildConfig.cwd, '/' + buildConfig.demo.template);
	const partialsDir = path.dirname(src);
	const dest = path.join('demos', buildConfig.staticSource !== 'dist' ? 'local' : '');
	const destName = buildConfig.demo.name + '.html';
	const origamiJsonPath = path.join(buildConfig.cwd, 'origami.json');
	let data;
	let partials;

	return loadDemoData(buildConfig)
		.then(demoData => {
			data = demoData;
			return fileExists(src);
		})
		.then(exists => {
			if (!exists) {
				const e = new Error(`Demo template not found: ${src}`);
				e.stack = '';
				throw e;
			}

			return Promise.all([
				files.getModuleName(buildConfig.cwd),
				getStylesheetTags(buildConfig.demo.sass, buildConfig.demo.dependencies, buildConfig.staticSource, buildConfig.cwd, buildConfig.brand),
				getScriptTags(buildConfig.demo.js, buildConfig.demo.dependencies, buildConfig.staticSource, buildConfig.cwd),
				readFile(src, {
					encoding: 'utf8'
				})
			]);
		})
		.then(([
			moduleName,
			oDemoStyle,
			oDemoScript,
			oDemoTpl
		]) => {
			data.oDemoTitle = moduleName + ': ' + buildConfig.demo.name + ' demo';
			data.oDemoStyle = oDemoStyle;
			data.oDemoScript = oDemoScript;
			data.oDemoDocumentClasses = buildConfig.demo.documentClasses || buildConfig.demo.bodyClasses;
			data.oDemoTpl = String(oDemoTpl);

			// log.secondary('Rendering: ' + dest + destName);

			return readFile(origamiJsonPath, {
				encoding: 'utf8'
			});
		})
		.then(file => {
			let origamiJson;
			try {
				origamiJson = JSON.parse(file);
			} catch (error) {
				const e = new Error(error + ' in ' + origamiJsonPath);
				e.stack = '';
				throw e;
			}

			let browserFeatures = [];
			if (origamiJson.browserFeatures) {
				browserFeatures = browserFeatures
					.concat(origamiJson.browserFeatures.required || [])
					.concat(origamiJson.browserFeatures.optional || []);
			}
			browserFeatures.push('default');
			data.oDemoBrowserFeatures = browserFeatures;

			return loadPartials(partialsDir);
		})
		.then(p => {
			partials = p;
			return readFile(path.join(__dirname, '/../../templates/page.mustache'), 'utf-8');
		})
		.then(template => {
			const result = mustache.render(mustache.render(template, data, partials), data, partials);
			return outputFile(path.join(buildConfig.cwd, dest, destName), result, 'utf-8');
		});
}

function loadPartials(partialsDir) {
	const partials = {};

	// Get a list of all mustache files in a directory
	return files.getMustacheFilesList(partialsDir)
		.then(filePaths => {
			return Promise.all(filePaths.map(filePath => {
				// Calculate the partial name, which is what is used
				// to refer to it in a template. We remove the base directory,
				// replace any preceeding slashes, and remove the extension.
				const partialName = filePath.replace(partialsDir, '').replace(/^\//, '').replace(/\.mustache$/i, '');

				// Add the name/content pair to the partials map
				return readFile(filePath, {
					encoding: 'utf8'
				})
					.then(file => {
						partials[partialName] = file;
					});
			}));
		})
		.then(() => {
			return partials;
		});
}

function getStylesheetTags(sassPath, dependencies, staticSource, cwd, brand) {
	return Promise.resolve('')
		.then((stylesheets) => {
			if (staticSource !== 'dist') {
				if (dependencies) {
					stylesheets += `<link rel="stylesheet" href="https://origami-build.ft.com/v2/bundles/css?modules=${dependencies.toString()}${brand ? `&brand=${brand}` : ''}" />\n\t`;
				}
				if (sassPath) {
					stylesheets += '<link rel="stylesheet" href="' + path.basename(sassPath).replace('.scss', '.css') + '" />';
				}
			} else {
				stylesheets += '<link rel="stylesheet" href="/v2/bundles/css?modules=';
				if (dependencies) {
					stylesheets += ',' + dependencies.toString();
				}
				if (sassPath) {
					return files.getModuleName(cwd)
						.then(moduleName => {
							stylesheets += moduleName + (sassPath !== 'main.scss' ? ':/' + sassPath : '');
							stylesheets += '" />';
							return stylesheets;
						});
				} else {
					stylesheets += '" />';
				}
			}
			return stylesheets;
		});
}

function getScriptTags(scriptPath, dependencies, staticSource, cwd) {
	return Promise.resolve('')
		.then(scripts => {
			if (staticSource !== 'dist') {
				if (dependencies) {
					scripts += '<script src="https://origami-build.ft.com/v2/bundles/js?modules=' + dependencies.toString() + '"></script>\n\t';
				}
				if (scriptPath) {
					scripts += '<script src="' + path.basename(scriptPath) + '"></script>';
				}
			} else {
				scripts += '<script src="/v2/bundles/js?modules=';
				if (dependencies) {
					scripts += ',' + dependencies.toString();
				}
				if (scriptPath) {
					return files.getModuleName(cwd)
						.then(moduleName => {
							scripts += moduleName + (scriptPath !== 'main.js' ? ':/' + scriptPath : '');
							scripts += '"></script>';
							return scripts;
						});
				}
				scripts += '"></script>';
			}

			return scripts;
		});
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

module.exports = function (cfg) {
	const config = cfg || {};
	const cwd = config.cwd || process.cwd();
	if (Boolean(config.demoConfig) && config.demoConfig !== 'origami.json') {
		return Promise.reject(new Error('Custom demo config files are not supported, please place demo config inside of origami.json.'));
	}

	const configPath = path.join(cwd, 'origami.json');
	return readFile(configPath, 'utf-8')
		.then(file => {
			let demosConfig;
			try {
				demosConfig = JSON.parse(file);
			} catch (error) {
				const e = new Error(`${configPath} is not valid JSON.`);
				e.stack = '';
				throw e;
			}

			const demos = [];

			if (!Array.isArray(demosConfig.demos)) {
				const e = new Error('No demos exist in origami.json file. Reference http://origami.ft.com/docs/syntax/origamijson/ to help configure demos for the component.');
				e.stack = '';
				throw e;
			}

			if (demosConfig.demos.length === 0) {
				const e = new Error('No demos exist in origami.json file. Reference http://origami.ft.com/docs/syntax/origamijson/ to help configure demos for the component.');
				e.stack = '';
				throw e;
			}

			if (!hasUniqueNames(demosConfig.demos)) {
				const e = new Error('Demos with the same name were found. Give them unique names and try again.');
				e.stack = '';
				throw e;
			}

			let demoFilters;
			if (config && typeof config.demoFilter === 'string') {
				demoFilters = config.demoFilter.split(',');
			} else if (config && Array.isArray(config.demoFilter)) {
				demoFilters = config.demoFilter;
			}

			if (!configPath.includes('origami.json')) {
				const e = new Error('Please move your demo config into origami.json following the spec: http://origami.ft.com/docs/syntax/origamijson');
				e.stack = '';
				throw e;
			}

			for (const demoConfig of demosConfig.demos) {
				if (!demoFilters || demoFilters && demoFilters.includes(demoConfig.name)) {
					demos.push(
						extend(
							true, {
								documentClasses: '',
								description: ''
							},
							demosConfig.demosDefaults || demosConfig.options,
							demoConfig
						)
					);
				}
			}

			if (demos.length === 0 && !config.suppressErrors) {
				let noDemosError = 'No demos were found';
				if (config && demoFilters) {
					noDemosError += ' for ' + String(demoFilters);
				}
				noDemosError += '.';

				const e = new Error(noDemosError);
				e.stack = '';
				throw e;
			}
			// Check if obt is watching for Sass changes.
			const watchingSass = config && (
				typeof config.watching === 'undefined' ||
				config.watching === 'sass'
			);
			// Check if obt is watching for JavaScript changes.
			const watchingJs = config && (
				typeof config.watching === 'undefined' ||
				config.watching === 'js'
			);
			// Create an array of configuration for each demo asset to build.
			const htmlBuildsConfig = [];
			const sassBuildsConfig = [];
			const jsBuildsConfig = [];
			// Create build configuration for each demo asset if it doesn't
			// already exist. For example two demos may share the same Sass.
			for (const demo of demos) {
				const buildConfig = {
					demo: demo || {},
					verbose: config.verbose,
					brand: config.brand,
					staticSource: config.production ? 'dist' : undefined,
					cwd: cwd
				};
				// Add demo html config.
				htmlBuildsConfig.push(buildConfig);
				// Only build Sass and JS if in a development environment.
				///
				// At the time of writing the origami-build-service uses the
				// origami-build-tools demo command to build demo html. When
				// production is true we do not build CSS/JS so
				// origami-build-service can return html quickly. It is unlikely
				// origami-build-tools will be a dependency of the build service
				// in the future, at which point production checks when building
				// demos becomes redundant.
				//
				// https://github.com/Financial-Times/origami-build-service/blob/3770a76ca3df19abaf99936110e171370b41bce5/lib/democompiler.js#L61
				if (!config.production) {
					const newSassBuild = !sassBuildsConfig.find(existingConfig =>
						existingConfig.demo.sass === buildConfig.demo.sass
					);
					if (demo.sass && watchingSass && newSassBuild) {
						sassBuildsConfig.push(buildConfig);
					}

					const newJsBuild = !jsBuildsConfig.find(existingConfig =>
						existingConfig.demo.js === buildConfig.demo.js
					);
					if (demo.js && watchingJs && newJsBuild) {
						jsBuildsConfig.push(buildConfig);
					}
				}
			}

			// Return build promises for all demo assets.
			return Promise.all([
				...htmlBuildsConfig.map(c => buildDemoHtml(c)),
				...sassBuildsConfig.map(c => buildDemoSass(c)),
				...jsBuildsConfig.map(c => buildDemoJs(c))
			]);
		}, () => {
			const configError = 'Couldn\'t find demos config path, checked: ' + configPath;
			const e = new Error(configError);
			e.stack = '';
			throw e;
		});
};
