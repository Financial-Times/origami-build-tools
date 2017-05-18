'use strict';
const chalk = require('chalk');
const logSymbols = require('log-symbols');
const figures = require('figures');
const elegantSpinner = require('elegant-spinner');
const logUpdate = require('log-update');
const indentString = require('indent-string');

const pointer = chalk.yellow(figures.pointer);
const skipped = chalk.yellow(figures.arrowDown);

const isDefined = x => x !== null && x !== undefined;

const getSymbol = (task, options) => {
	if (!task.spinner) {
		task.spinner = elegantSpinner();
	}

	if (task.isPending()) {
		return options.showSubtasks !== false && task.subtasks.length > 0 ? pointer : chalk.yellow(task.spinner());
	}

	if (task.isCompleted()) {
		return logSymbols.success;
	}

	if (task.hasFailed()) {
		return task.subtasks.length > 0 ? pointer : logSymbols.error;
	}

	if (task.isSkipped()) {
		return skipped;
	}

	return ' ';
};

const renderHelper = (tasks, options, level) => {
	level = level || 0;

	let output = [];

	for (const task of tasks) {
		if (task.isEnabled()) {
			const skipped = task.isSkipped() ? ` ${chalk.dim('[skipped]')}` : '';

			output.push(indentString(` ${getSymbol(task, options)} ${task.title}${skipped}`, level, '  '));

			if ((task.isPending() || task.isSkipped() || task.hasFailed() || task.isCompleted()) && isDefined(task.output)) {
				const data = task.output.split('\n');
				if (Array.isArray(data) && data.length) {
					for (const datum of data) {
						const out = indentString(`${figures.arrowRight} ${datum}`, level, '  ');
						output.push(`   ${chalk.gray(out)}`);
					}
				}
			}

			if ((task.isPending() || task.hasFailed() || options.collapse === false) && (task.hasFailed() || options.showSubtasks !== false) && task.subtasks.length > 0) {
				output = output.concat(renderHelper(task.subtasks, options, level + 1));
			}
		}
	}

	return output.join('\n');
};

const render = (tasks, options) => {
	logUpdate(renderHelper(tasks, options));
};

class UpdateRenderer {

	constructor(tasks, options) {
		this._tasks = tasks;
		this._options = Object.assign({
			showSubtasks: true,
			collapse: true,
			clearOutput: false
		}, options);
	}

	render() {
		if (this._id) {
			// Do not render if we are already rendering
			return;
		}

		this._id = setInterval(() => {
			render(this._tasks, this._options);
		}, 100);
	}

	end(err) {
		if (this._id) {
			clearInterval(this._id);
			this._id = undefined;
		}

		render(this._tasks, this._options);

		if (this._options.clearOutput && err === undefined) {
			logUpdate.clear();
		} else {
			logUpdate.done();
		}
	}
}

module.exports = UpdateRenderer;
