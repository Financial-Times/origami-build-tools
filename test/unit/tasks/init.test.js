/* eslint-env mocha */
'use strict';

const proclaim = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

sinon.assert.expose(proclaim, {
	includeFail: false,
	prefix: ''
});

describe('Boilerplate task', function() {
	let Listr;
	let init;
	let buildBoilerplate;
	let listrInstance;

	beforeEach(() => {
		listrInstance = {
			run: sinon.stub()
		};
		Listr = sinon.stub();
		Listr.returns(listrInstance);
		buildBoilerplate = sinon.stub();

		mockery.enable({
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		});

		mockery.registerMock('listr', Listr);

		mockery.registerMock('./boilerplate', buildBoilerplate);

		mockery.registerAllowable('../../../lib/tasks/init');

		init = require('../../../lib/tasks/init');

		mockery.resetCache();
	});

	after(() => {
		mockery.resetCache();
		mockery.deregisterAll();
		mockery.disable();
	});

	it('should export a function', function() {
		proclaim.isFunction(init);
	});

	describe('when called', () => {
		it('should create Listr object with build tasks', function() {
			init();

			Listr.firstCall.args[0][0].task();

			proclaim.calledOnce(Listr);
			proclaim.calledWithNew(Listr);
			proclaim.isArray(Listr.firstCall.args[0]);
			proclaim.calledOnce(buildBoilerplate);
		});
	});
});
