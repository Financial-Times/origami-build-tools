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
	let boilerplate;
	let buildBoilerplateTree;
	let listrInstance;

	beforeEach(() => {
		listrInstance = {
			run: sinon.stub()
		};
		Listr = sinon.stub();
		Listr.returns(listrInstance);
		buildBoilerplateTree = sinon.stub();

		mockery.enable({
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		});

		mockery.registerMock('listr', Listr);

		mockery.registerMock('./boilerplate-tree', buildBoilerplateTree);

		mockery.registerAllowable('../../../lib/tasks/boilerplate');

		boilerplate = require('../../../lib/tasks/boilerplate');

		mockery.resetCache();
	});

	after(() => {
		mockery.resetCache();
		mockery.deregisterAll();
		mockery.disable();
	});

	it('should export a function', function() {
		proclaim.isFunction(boilerplate);
	});

	describe('when called', () => {
		it('should create Listr object with build tasks', function() {
			boilerplate();

			Listr.firstCall.args[0][0].task();

			proclaim.calledOnce(Listr);
			proclaim.calledWithNew(Listr);
			proclaim.isArray(Listr.firstCall.args[0]);
			proclaim.calledOnce(buildBoilerplateTree);
		});
	});
});
