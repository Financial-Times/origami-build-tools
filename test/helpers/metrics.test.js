/* eslint-env mocha, expect */
'use strict';

const expect = require('expect.js');
const mockery = require('mockery');
const sinon = require('sinon');

describe('metrics helper', function() {

	const moduleUnderTest = '../../lib/helpers/metrics';

	const graphiteMock = {
		createClient: sinon.stub()
	};

	beforeEach(function() {
		graphiteMock.createClient.reset();

		mockery.enable({
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		});

		mockery.registerMock('graphite', graphiteMock);

		mockery.registerAllowable(moduleUnderTest);

		mockery.resetCache();
	});

	after(() => {
		mockery.resetCache();
		mockery.deregisterAll();
		mockery.disable();
	});

	it('exports a function', function() {
		expect(typeof require(moduleUnderTest)).to.equal('function');
		expect(require(moduleUnderTest).length).to.equal(1);
	});

	it('creates a graphite client pointing to FT\'s graphite server', function() {
		require(moduleUnderTest);
		expect(graphiteMock.createClient.calledOnce).to.equal(true);
		expect(graphiteMock.createClient.args[0][0]).to.equal('plaintext://graphite.ft.com:2003');
	});

	it('adds the obt namespace to all metrics', function() {
		const writeMock = sinon.stub();
		graphiteMock.createClient.returns({
			write: writeMock
		});
		require(moduleUnderTest)({nodeVersion: 4});
		expect(writeMock.calledOnce).to.equal(true);
		expect(writeMock.args[0][0]).to.eql({ origami: { buildtools: { nodeVersion: 4 } } });
	});

	it('passes graphite.end into graphite.write as callback', function() {
		const writeMock = sinon.stub();
		const endMock = sinon.stub();
		graphiteMock.createClient.returns({
			write: writeMock,
			end: endMock
		});
		require(moduleUnderTest)({nodeVersion: 4});
		expect(writeMock.calledOnce).to.equal(true);
		expect(endMock.calledOnce).to.equal(false);
		writeMock.callArg(1);
		expect(endMock.calledOnce).to.equal(true);
	});
});
