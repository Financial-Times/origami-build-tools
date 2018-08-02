'use strict';

const ciConfigYml = require('./component-boilerplate/ci-config-yml');
const demoJs = require('./component-boilerplate/demo-js');
const demoMustache = require('./component-boilerplate/demo-mustache');
const demoPa11y = require('./component-boilerplate/demo-pa11y');
const demoSass = require('./component-boilerplate/demo-sass');
const eslint = require('./component-boilerplate/eslint');
const gitIgnore = require('./component-boilerplate/git-ignore');
const mainJs = require('./component-boilerplate/main-js');
const mainScss = require('./component-boilerplate/main-scss');
const origamiJson = require('./component-boilerplate/origami-json');
const readMe = require('./component-boilerplate/read-me');
const srcJs = require('./component-boilerplate/src-js');
const srcSassMixins = require('./component-boilerplate/src-sass-mixins');
const srcSassVariables = require('./component-boilerplate/src-sass-variables');
const packageJson = require('./component-boilerplate/package-json');
const testFixtures = require('./component-boilerplate/test-fixtures');
const testMain = require('./component-boilerplate/test-main');
const testSassMain = require('./component-boilerplate/test-sass-main');
const testSassMixins = require('./component-boilerplate/test-sass-mixins');

module.exports = {
	ciConfigYml,
	demoJs,
	demoMustache,
	demoPa11y,
	demoSass,
	eslint,
	gitIgnore,
	mainJs,
	mainScss,
	origamiJson,
	readMe,
	srcJs,
	srcSassMixins,
	srcSassVariables,
	packageJson,
	testFixtures,
	testMain,
	testSassMain,
	testSassMixins
};
