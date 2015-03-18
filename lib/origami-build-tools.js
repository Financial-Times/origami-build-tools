'use strict';

require('es6-promise').polyfill();
require('isomorphic-fetch');

var update = require('./helpers/update-notifier');
var log = require('./helpers/log');
update();

function TaskLoader() {
	this.tasks = {
		'install': './tasks/install',
		'build': './tasks/build',
		'demo': './tasks/demo',
		'verify': './tasks/verify',
		'test': './tasks/test',
		'docs': './tasks/docs',
		'--version': './tasks/version'
	};
}


TaskLoader.prototype.load = function(taskName) {
	var startTime = process.hrtime();
	var module = require(this.tasks[taskName]);
	var timeTaken = process.hrtime(startTime);
	log.debug("Loaded task: " + taskName + " in " + timeTaken.join(".") + "s");
	return module;
};

TaskLoader.prototype.isValid = function(taskName) {
	return this.tasks.hasOwnProperty(taskName);
};

TaskLoader.prototype.list = function() {
	return Object.keys(this.tasks);
};

TaskLoader.prototype.loadAll = function() {
	var loader = this;
	return this.list().reduce(function(modules, module) {
		modules[module] = loader.load(module);
		return modules;
	}, {});
};

module.exports = new TaskLoader();
