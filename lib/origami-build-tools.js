'use strict';

require('es6-promise').polyfill();
require('isomorphic-fetch');

var update = require('./helpers/update-notifier');
var verifier = require('./tasks/verify');
var installer = require('./tasks/install');
var builder = require('./tasks/build');
var tester = require('./tasks/test');
var demoer = require('./tasks/demo');
var docs = require('./tasks/docs');
var version = require('./tasks/version');

update();

var tasks = {
	'install': installer,
	'build': builder,
	'demo': demoer,
	'verify': verifier,
	'test': tester,
	'docs': docs,
	'--version': version
};

module.exports = tasks;
