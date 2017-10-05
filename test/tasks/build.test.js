/* eslint-env mocha */
'use strict';

const proclaim = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');
sinon.assert.expose(proclaim, {
	includeFail: false,
	prefix: ''
});

describe('Build task', function() {
	let Listr;
	let buildJS;
	let buildSass;
	let build;
	let listrInstance;

	beforeEach(() => {
		listrInstance = {
			run: sinon.stub()
		};
		Listr = sinon.stub();
		Listr.returns(listrInstance);
		buildJS = sinon.stub();
		buildSass = sinon.stub();

		mockery.enable({
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		});

		mockery.registerMock('listr', Listr);

		mockery.registerMock('./build-js', buildJS);
		mockery.registerMock('./build-sass', buildSass);

		mockery.registerAllowable('../../lib/tasks/build');

		build = require('../../lib/tasks/build');

		mockery.resetCache();
	});

	after(() => {
		mockery.resetCache();
		mockery.deregisterAll();
		mockery.disable();
	});

	it('should export a function', function() {
		proclaim.isFunction(build);
	});

	describe('when called', () => {
		it('should create Listr object with build tasks', function() {
			build();

			Listr.firstCall.args[0][0].task();
			Listr.firstCall.args[0][1].task();

			proclaim.calledOnce(Listr);
			proclaim.calledWithNew(Listr);
			proclaim.isArray(Listr.firstCall.args[0]);
			proclaim.calledOnce(buildJS);
			proclaim.calledOnce(buildSass);
		});
	});
});
