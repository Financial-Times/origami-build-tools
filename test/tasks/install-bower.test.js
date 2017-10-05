/* eslint-env mocha */
'use strict';

const proclaim = require('proclaim');
const process = require('process');
const fs = require('fs-extra');
const path = require('path');
const mockery = require('mockery');
const sinon = require('sinon');
sinon.assert.expose(proclaim, {
	includeFail: false,
	prefix: ''
});

const obtPath = process.cwd();
const oTestPath = 'test/fixtures/o-test';
const pathSuffix = '-verify';
const verifyTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

describe('install-bower', function () {
	let bowerInstall;
	let Listr;
	let listrInstance;

	beforeEach(function () {
		listrInstance = {
			run: sinon.stub()
		};
		Listr = sinon.stub();
		Listr.returns(listrInstance);

		mockery.enable({
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		});

		mockery.registerMock('listr', Listr);

		mockery.registerAllowable('../../lib/tasks/install-bower');

		bowerInstall = require('../../lib/tasks/install-bower');

		mockery.resetCache();

		fs.copySync(path.resolve(obtPath, oTestPath), verifyTestPath);
		process.chdir(verifyTestPath);
	});

	afterEach(function () {
		process.chdir(obtPath);
		fs.removeSync(path.resolve(obtPath, verifyTestPath));
		mockery.resetCache();
		mockery.deregisterAll();
		mockery.disable();
	});

	it('has a default title', () => {
		proclaim.equal(bowerInstall().title, 'Installing Bower components');
	});

	describe('skip', () => {
		it('should return true if bower.json does not exist', function() {
			return bowerInstall().skip()
			.then(skipped => {
				proclaim.ok(skipped);
			});
		});

		it('should return a helpful message if bower.json does not exist', function() {
			return bowerInstall().skip()
			.then(skipped => {
				proclaim.equal(skipped, 'No bower.json found.');
			});
		});

		it('should return a falsey value if bower.json does exist', function() {
			fs.writeFileSync('bower.json', '{}');
			return bowerInstall().skip()
			.then(skipped => {
				proclaim.notOk(skipped);
			});
		});
	});

	describe('task', function () {
		it('should create Listr object with verify tasks', function() {
			bowerInstall().task();

			proclaim.calledOnce(Listr);
			proclaim.calledWithNew(Listr);
			proclaim.isArray(Listr.firstCall.args[0]);
		});
	});
});
