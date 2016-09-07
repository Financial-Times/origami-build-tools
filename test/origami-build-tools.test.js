/* eslint-env mocha, expect */
'use strict';
const expect = require('expect.js');
const mockery = require('mockery');
const sinon = require('sinon');

describe('obt', function() {

	const fetchMock = sinon.stub();
	mockery.registerMock('isomorphic-fetch', fetchMock);

	const updateNotifierMock = sinon.stub();
	mockery.registerMock('./helpers/update-notifier', updateNotifierMock);

	const logMock = sinon.stub();
	mockery.registerMock('./helpers/log', logMock);

	const metricsMock = sinon.stub();
	mockery.registerMock('./helpers/metrics', metricsMock);

	const moduleUnderTest = '../lib/origami-build-tools';

	mockery.enable({
		useCleanCache: true,
		warnOnReplace: false,
		warnOnUnregistered: false
	});

	mockery.registerAllowable(moduleUnderTest);

	const version = process.version;

	beforeEach(function() {
		mockery.resetCache();
		fetchMock.reset();
		logMock.reset();
		updateNotifierMock.reset();
		metricsMock.reset();
	});

	after(() => {
		mockery.resetCache();
		mockery.deregisterAll();
		mockery.disable();
		process.version = version;
	});

	it('passes the node major version to the metrics module', function() {
		delete process.version;
		process.version = 'v6.0.1';
		require(moduleUnderTest);
		expect(metricsMock.calledOnce).to.equal(true);
		expect(metricsMock.args[0].length).to.equal(1);
		expect(metricsMock.args[0][0]).to.eql({
			nodeVersion: {
				invoked: {
					6: 1
				}
			}
		});
	});

	it('passes the node major version to the metrics module', function() {
		delete process.version;
		process.version = 'v4.0.1';
		require(moduleUnderTest);
		expect(metricsMock.calledOnce).to.equal(true);
		expect(metricsMock.args[0].length).to.equal(1);
		expect(metricsMock.args[0][0]).to.eql({
			nodeVersion: {
				invoked: {
					4: 1
				}
			}
		});
	});
});
