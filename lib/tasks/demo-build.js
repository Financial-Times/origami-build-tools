'use strict';

const fs = require('fs-extra');
const path = require('path');
const mergeDeep = require('merge-deep');
const files = require('../helpers/files');
const buildJs = require('../tasks/build-js');
const buildSass = require('../tasks/build-sass');
const constructPolyfillUrl = require('../helpers/construct-polyfill-url');
const mustache = require('mustache');
const denodeify = require('util').promisify;

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

			const sassConfig = {
				sass: src,
				// For the Sass files to load correctly, they need to be in one of these two directories.
				// Sass doesn't look in subdirectories and we can't use wildcards
				sassIncludePaths: ['demos/src', 'demos/src/scss'],
				sourcemaps: true,
				buildCss: path.basename(buildConfig.demo.sass).replace('.scss', '.css'),
				buildFolder: dest,
				cwd: buildConfig.cwd,
				brand: buildConfig.brand
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
		const dataPath = path.join(buildConfig.cwd, '/' + buildConfig.demo.data);
		return loadLocalDemoData(dataPath);
	} else if (typeof buildConfig.demo.data === 'object') {
		return Promise.resolve(buildConfig.demo.data);
	} else {
		return Promise.resolve({});
	}
}

function buildDemoHtml(buildConfig) {
	const src = path.join(buildConfig.cwd, '/' + buildConfig.demo.template);
	const partialsDir = path.dirname(src);
	const dest = path.join('demos', 'local');
	const destName = buildConfig.demo.name + '.html';
	let data;
	let partials;
	const configuredPartials = {};

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
				readFile(src, {
					encoding: 'utf8'
				})
			]);
		})
		.then(([
			moduleName,
			oDemoTpl
		]) => {
			const dependencies = buildConfig.demo.dependencies;
			const sassPath = buildConfig.demo.sass;
			const jsPath = buildConfig.demo.js;
			const brand = buildConfig.brand;
			data.oDemoTitle = moduleName + ': ' + buildConfig.demo.name + ' demo';
			data.oDemoDocumentClasses = buildConfig.demo.documentClasses || buildConfig.demo.bodyClasses;

			data.oDemoComponentStylePath = sassPath ?
				path.basename(sassPath).replace('.scss', '.css') :
				'';

			data.oDemoComponentScriptPath = jsPath ? path.basename(jsPath) : '';

			data.oDemoDependenciesStylePath = dependencies ?
				`https://www.ft.com/__origami/service/build/v2/bundles/css?modules=${dependencies.toString()}${brand ? `&brand=${brand}` : ''}` :
				'';

			data.oDemoDependenciesScriptPath = dependencies ?
				'https://www.ft.com/__origami/service/build/v2/bundles/js?modules=' + dependencies.toString() :
				'';

			configuredPartials.oDemoTpl = String(oDemoTpl);

			return constructPolyfillUrl();
		})
		.then(polyfillUrl => {
			data.oDemoPolyfillUrl = polyfillUrl;
			return loadPartials(partialsDir);
		})
		.then(p => {
			partials = p;
			return readFile(path.join(__dirname, '/../../templates/page.mustache'), 'utf-8');
		})
		.then(template => {
			const result = mustache.render(template, data, Object.assign(configuredPartials, partials));
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
					demos.push(mergeDeep(
						{
							documentClasses: '',
							description: ''
						},
						demosConfig.demosDefaults || demosConfig.options,
						demoConfig
					));
				}
			}

			// Create an array of configuration for each demo asset to build.
			const htmlBuildsConfig = [];
			const sassBuildsConfig = [];
			const jsBuildsConfig = [];
			// Create build configuration for each demo asset if it doesn't
			// already exist. For example two demos may share the same Sass.
			for (const demo of demos) {
				const buildConfig = {
					demo: demo || {},
					brand: config.brand,
					cwd: cwd
				};
				// Add demo html config.
				htmlBuildsConfig.push(buildConfig);
				const newSassBuild = !sassBuildsConfig.find(existingConfig =>
					existingConfig.demo.sass === buildConfig.demo.sass
				);
				if (demo.sass && newSassBuild) {
					sassBuildsConfig.push(buildConfig);
				}

				const newJsBuild = !jsBuildsConfig.find(existingConfig =>
					existingConfig.demo.js === buildConfig.demo.js
				);
				if (demo.js && newJsBuild) {
					jsBuildsConfig.push(buildConfig);
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
