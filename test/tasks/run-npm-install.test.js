/* eslint-env mocha */
'use strict';

const proclaim = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('run-npm-install', function() {
	let runNpmInstall;
	let commandLine;
	beforeEach(function() {
		commandLine = {
			run: sinon.stub().resolves()
		};

		mockery.enable({
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		});

		mockery.registerMock('../helpers/command-line', commandLine);

		mockery.registerAllowable('../../lib/helpers/run-npm-install');

		runNpmInstall = require('../../lib/tasks/run-npm-install');
	});

	afterEach(() => {
		mockery.resetCache();
		mockery.deregisterAll();
		mockery.disable();
	});

	it('exports a function', function() {
		proclaim.isFunction(runNpmInstall);
	});

	it('calls npm install via commandLine module', () => {
		return runNpmInstall()
			.then(() => {
				proclaim.calledOnce(commandLine.run);
				proclaim.calledWithExactly(commandLine.run, 'npm', ['install'], undefined);
			});
	});

	it('returns a rejected promise if commandLine.run returns a rejected promise', () => {
		commandLine.run.rejects();

		return runNpmInstall()
			.then(() => {
				proclaim.fail();
			}, () => {
				proclaim.ok(true);
			});
	});

	it('returns a resolved promise if commandLine.run returns a resolved promise', () => {
		commandLine.run.resolves('done');

		return runNpmInstall()
			.then(result => {
				proclaim.equal(result, 'done');
			});
	});
});
