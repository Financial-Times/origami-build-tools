"use strict";

var update = require('./helpers/update-notifier'),
	verifier = require('./tasks/verify'),
    installer = require('./tasks/install'),
    builder = require('./tasks/build'),
    tester = require('./tasks/test'),
    demoer = require('./tasks/demo');

update();

var tasks = {
	'install': installer,
	'build': builder,
	'test': tester,
	'demo': demoer,
	'verify': verifier
};

module.exports = tasks;
