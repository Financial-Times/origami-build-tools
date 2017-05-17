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

describe('npm-install', function () {
	let npmInstall;
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

		mockery.registerAllowable('../../lib/tasks/npm-install');

		npmInstall = require('../../lib/tasks/npm-install');

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
		proclaim.equal(npmInstall.title, 'Installing NPM components');
	});

	describe('skip', () => {
		it('should return true if package.json does not exist', () => {
			proclaim.ok(npmInstall.skip());
		});

		it('should return a helpful message if package.json does not exist', () => {
			proclaim.equal(npmInstall.skip(), 'No package.json found.');
		});

		it('should return a falsey value if package.json does exist', () => {
			fs.writeFileSync('package.json', '{}');
			proclaim.notOk(npmInstall.skip());
		});
	});

	describe('task', function () {
		it('should create Listr object with verify tasks', function() {
			npmInstall.task();

			proclaim.calledOnce(Listr);
			proclaim.calledWithNew(Listr);
			proclaim.isArray(Listr.firstCall.args[0]);
		});
	});
});
