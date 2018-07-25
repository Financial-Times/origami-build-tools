'use strict';

const Listr = require('listr');

// const bowerInstall = require('./install-bower');
// const npmInstall = require('./install-npm');

const fs = require('fs-extra');
const path = require('path');
const denodeify = require('denodeify');
const template = require('./../../templates/boilerplate.js');
const readFile = denodeify(fs.readFile);
const outputFile = denodeify(fs.outputFile);

function wtf (componentName) {
	//TODO add failsafe to check for file existing so as not to overwrite :scream:
	outputFile(`${componentName.original}/.gitignore`, template.gitIgnore());
	outputFile(`${componentName.original}/main.js`, template.mainJs(componentName));
	outputFile(`${componentName.original}/main.scss`, template.mainScss(componentName));
	outputFile(`${componentName.original}/origami.json`, template.origamiJson(componentName));
	outputFile(`${componentName.original}/README.md`, template.readMe(componentName));
	outputFile(`${componentName.original}/.circleci/config.yml`, template.ciConfigYml());
	outputFile(`${componentName.original}/src/js/${componentName.original}.js`, template.srcJs(componentName));
	outputFile(`${componentName.original}/src/scss/_mixins.scss`);
	outputFile(`${componentName.original}/src/scss/_variables.scss`, template.srcSassVariables(componentName));
	outputFile(`${componentName.original}/demos/src/demo.js`, template.demoJs());
	outputFile(`${componentName.original}/demos/src/demo.scss`, template.demoSass(componentName));
}

function camelCase (string) {
	return string.replace(/\-+(.)/g, (match, chr) => { return chr.toUpperCase(); });
}

function titleCase (string) {
	return string.toLowerCase().split('-').map(function(word) {
		return word.replace(word[0], word[0].toUpperCase());
	}).join('').substring(1, -1);
}

module.exports = function (cfg) {
	cfg = cfg || {};
	const config = cfg.flags || {};
	const componentName = cfg.input[1] || 'o-component-boilerplate';
	config.name = {
		original: componentName,
		camelCase: camelCase(componentName),
		titleCase: titleCase(componentName)
	};
	config.cwd = config.cwd || process.cwd();

	return new Listr([{
		title: 'BUILDING COMPONENT BOILERPLATE YEA',
		task: () => {
			wtf(config.name);
		}
	}], {
		renderer: require('../helpers/listr-renderer')
	}).run();
};

module.exports.watchable = false;
