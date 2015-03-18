'use strict';

require('es6-promise').polyfill();

var update = require('./helpers/update-notifier');
var log = require('./helpers/log');
update();
var tasks = {
	'install': './tasks/install',
	'build': './tasks/build',
	'demo': './tasks/demo',
	'verify': './tasks/verify',
	'test': './tasks/test',
	'docs': './tasks/docs',
	'--version': './tasks/version'
};

function TaskLoader() {
	this.tasks = tasks;
	this.taskCache = {};
}

// For backwards compatibility allow access of each task via a property of the
// TaskLoader
Object.keys(tasks).forEach(function(task) {
	Object.defineProperty(TaskLoader.prototype, task, {
		get: function() {
			return this.load(task);
		}
	});
});


TaskLoader.prototype.load = function(taskName) {
	if (this.taskCache.hasOwnProperty(taskName)) {
		return this.taskCache[taskName];
	}

	var startTime = process.hrtime();
	var module = require(this.tasks[taskName]);
	var timeTaken = process.hrtime(startTime);
	log.debug("Loaded task: " + taskName + " in " + timeTaken.join(".") + "s");
	this.taskCache[taskName] = module;
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
