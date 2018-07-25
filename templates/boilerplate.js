'use strict';

const mainJs = require('./component-boilerplate/main-js');
const mainScss = require('./component-boilerplate/main-scss');
const srcJs = require('./component-boilerplate/src-js');
const demoJs = require('./component-boilerplate/demo-js');

module.exports = {
	demoJs,
	demoSASS: (name) => {
		return `$${name.original}-is-silent: false;
@import '../../main';`;
	},
	mainJs,
	mainScss,
	srcJs,
	srcSASSVariables: (name) => `$${name.original}-is-silent: true !default;`,
};
