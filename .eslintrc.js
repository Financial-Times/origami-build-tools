'use strict';

const origamiComponentConfig = require('./config/.eslintrc.js');
const merge = require('merge-deep');

const origamiServicesConfig = merge({},
	origamiComponentConfig, {
		"ecmaFeatures": {
			"modules": false
		},
		"parserOptions": {
			"ecmaVersion": 6,
			"sourceType": "script"
		},
		"env": {
			"es6": true,
			"browser": false,
			"node": true
		},
		"rules": {
			"no-console": 0,
		},
		globals:
		{
			require: true,
			module: true,
			exports: true
		}
	}
);

module.exports = origamiServicesConfig;
