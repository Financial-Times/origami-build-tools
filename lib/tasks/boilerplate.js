'use strict';

const fs = require('fs-extra');
const path = require('path');
const template = require('./../../templates/boilerplate.js');

const buildTree = (root, name) => {
	const generate = (file, template) => fs.outputFile(path.join(root, file), template);

	return Promise.all([
		generate('/.circleci/config.yml', template.ciConfigYml()),
		generate('/.gitignore', template.gitIgnore()),
		generate('/.eslintrc.json', template.eslint()),
		generate('/bower.json', template.bowerJson(name)),
		generate('/main.js', template.mainJs(name)),
		generate('/main.scss', template.mainScss(name)),
		generate('/MIGRATION.md', template.migration(name)),
		generate('/origami.json', template.origamiJson(name)),
		generate('/package.json', template.packageJson()),
		generate('/README.md', template.readMe(name)),
		generate('/demos/src/demo.js', template.demoJs()),
		generate('/demos/src/demo.mustache', template.demoMustache(name)),
		generate('/demos/src/pa11y.mustache', template.demoPa11y(name)),
		generate('/demos/src/demo.scss', template.demoSass(name)),
		generate(`/src/js/${name.plainName}.js`, template.srcJs(name)),
		generate('/src/scss/_functions.scss', ''),
		generate('/src/scss/_mixins.scss', template.srcSassMixins(name)),
		generate('/src/scss/_variables.scss', template.srcSassVariables(name)),
		generate('/src/scss/_brand.scss', template.srcSassBrand(name)),
		generate(`/test/${name.camelCase}.test.js`, template.testMain(name)),
		generate(`/test/helpers/fixtures.js`, template.testFixtures(name)),
		generate(`/test/scss/index.test.scss`, template.testSassMain(name)),
		generate(`/test/scss/_mixins.test.scss`, template.testSassMixins(name))
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
