/* eslint-env mocha */
'use strict';

const proclaim = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('run-bower-install', function() {
	let runBowerInstall;
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

		mockery.registerAllowable('../../lib/helpers/run-bower-install');

		runBowerInstall = require('../../lib/tasks/run-bower-install');
	});

	afterEach(() => {
		mockery.resetCache();
		mockery.deregisterAll();
		mockery.disable();
	});

	it('exports a function', function() {
		proclaim.isFunction(runBowerInstall);
	});

	it('calls bower install via commandLine module', () => {
		return runBowerInstall()
			.then(() => {
				proclaim.calledOnce(commandLine.run);
				proclaim.calledWithExactly(commandLine.run, require.resolve('bower/bin/bower'), [
					'install',
					'--config.registry.search=http://registry.origami.ft.com',
					'--config.registry.search=https://registry.bower.io'
				], undefined);
			});
	});

	it('returns a rejected promise if commandLine.run returns a rejected promise', () => {
		commandLine.run.rejects();

		return runBowerInstall()
			.then(() => {
				proclaim.fail();
			}, () => {
				proclaim.ok(true);
			});
	});

	it('returns a resolved promise if commandLine.run returns a resolved promise', () => {
		commandLine.run.resolves('done');

		return runBowerInstall()
			.then(result => {
				proclaim.equal(result, 'done');
			});
	});
});
