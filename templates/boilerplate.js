'use strict';

const ciConfigYml = require('./component-boilerplate/ci-config-yml');
const demoJs = require('./component-boilerplate/demo-js');
const demoMustache = require('./component-boilerplate/demo-mustache');
const demoSass = require('./component-boilerplate/demo-sass');
const gitIgnore = require('./component-boilerplate/git-ignore');
const mainJs = require('./component-boilerplate/main-js');
const mainScss = require('./component-boilerplate/main-scss');
const origamiJson = require('./component-boilerplate/origami-json');
const readMe = require('./component-boilerplate/read-me');
const srcJs = require('./component-boilerplate/src-js');
const testFixtures = require('./component-boilerplate/test-fixtures');
const testMain = require('./component-boilerplate/test-main');

module.exports = {
	ciConfigYml,
	demoJs,
	demoMustache,
	demoSass,
	gitIgnore,
	mainJs,
	mainScss,
	origamiJson,
	readMe,
	srcJs,
	srcSassVariables: (name) => `$${name.original}-is-silent: true !default;
	`,
	srcSassMixins: (name) => `@mixin ${name.camelCase} () {}
	`,
	testFixtures,
	testMain
};
