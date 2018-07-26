'use strict';

const fs = require('fs-extra');
const path = require('path');
const template = require('./../../templates/boilerplate.js');

const buildTree = (root, name) => {
	const joinPath = file => path.join(root, file);

	return Promise.all([
		fs.outputFile(joinPath('/.gitignore'), template.gitIgnore()),
		fs.outputFile(joinPath('/main.js'), template.mainJs(name)),
		fs.outputFile(joinPath('/main.scss'), template.mainScss(name)),
		fs.outputFile(joinPath('/origami.json'), template.origamiJson(name)),
		fs.outputFile(joinPath('/README.md'), template.readMe(name)),
		fs.outputFile(joinPath('/.circleci/config.yml'), template.ciConfigYml()),
		fs.outputFile(joinPath(`/src/js/${name.original}.js`), template.srcJs(name)),
		fs.outputFile(joinPath('/src/scss/_mixins.scss'), ''),
		fs.outputFile(joinPath('/src/scss/_variables.scss'), template.srcSassVariables(name)),
		fs.outputFile(joinPath('/demos/src/demo.js'), template.demoJs()),
		fs.outputFile(joinPath('/demos/src/demo.scss'), template.demoSass(name))
	]);
};

module.exports = (config) => {
	const name = config.name;
	const root = path.join(config.cwd, name.original);

	return fs.pathExists(root)
		.then(exists => {
			if (exists) {
				return Promise.reject(new Error(`'${name.original}' already exists in this directory.`));
			} else {
				buildTree(root, name);
			}
		});
};
