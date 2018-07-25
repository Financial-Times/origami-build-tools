'use strict';


const fs = require('fs-extra');
const denodeify = require('denodeify');
const outputFile = denodeify(fs.outputFile);
const template = require('./../../templates/boilerplate.js');

module.exports = (config) => {
	const name = config.name;
	//TODO add failsafe to check for file existing so as not to overwrite file structure accidentally :scream:
	outputFile(`${name.original}/.gitignore`, template.gitIgnore());
	outputFile(`${name.original}/main.js`, template.mainJs(name));
	outputFile(`${name.original}/main.scss`, template.mainScss(name));
	outputFile(`${name.original}/origami.json`, template.origamiJson(name));
	outputFile(`${name.original}/README.md`, template.readMe(name));
	outputFile(`${name.original}/.circleci/config.yml`, template.ciConfigYml());
	outputFile(`${name.original}/src/js/${name.original}.js`, template.srcJs(name));
	outputFile(`${name.original}/src/scss/_mixins.scss`);
	outputFile(`${name.original}/src/scss/_variables.scss`, template.srcSassVariables(name));
	outputFile(`${name.original}/demos/src/demo.js`, template.demoJs());
	outputFile(`${name.original}/demos/src/demo.scss`, template.demoSass(name));
};
