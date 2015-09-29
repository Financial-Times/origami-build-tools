'use strict';

require('isomorphic-fetch');

const update = require('./helpers/update-notifier');
const log = require('./helpers/log');
update();

function TaskLoader() {
	this.tasks = {
		'install': './tasks/install',
		'build': './tasks/build',
		'demo': './tasks/demo',
		'verify': './tasks/verify',
		'test': './tasks/test',
		'--version': './tasks/version'
	};

	this.taskCache = {};

	// Allow access of each task via a property of the TaskLoader
	Object.keys(this.tasks).forEach(function(task) {
		Object.defineProperty(TaskLoader.prototype, task, {
			get: function() {
				return this.load(task);
			}
		});
	});
}

TaskLoader.prototype.load = function(taskName) {
	if (this.taskCache.hasOwnProperty(taskName)) {
		return this.taskCache[taskName];
	}

	const startTime = process.hrtime();
	const module = require(this.tasks[taskName]);
	const timeTaken = process.hrtime(startTime);
	log.debug('Loaded task: ' + taskName + ' in ' + timeTaken.join('.') + 's');
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
	const loader = this;
	return this.list().reduce(function(modules, task) {
		modules[task] = loader.load(task);
		return modules;
	}, {});
};

module.exports = new TaskLoader();
