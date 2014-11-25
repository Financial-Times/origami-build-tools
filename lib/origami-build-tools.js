'use strict';

require('es6-promise').polyfill();

var update = require('./helpers/update-notifier'),
	verifier = require('./tasks/verify'),
	installer = require('./tasks/install'),
	builder = require('./tasks/build'),
	tester = require('./tasks/test'),
	demoer = require('./tasks/demo'),
	docs = require('./tasks/docs');

update();

var tasks = {
	'install': installer,
	'build': builder,
	'test': tester,
	'demo': demoer,
	'docs': docs,
	'verify': verifier
};

module.exports = tasks;
