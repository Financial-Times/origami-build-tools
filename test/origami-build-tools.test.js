/* eslint-env mocha, expect */
'use strict';

const expect = require('expect.js');
const mockery = require('mockery');
const sinon = require('sinon');

describe('obt', function() {

	const moduleUnderTest = '../lib/origami-build-tools';

	const version = process.version;
	const fetchMock = sinon.stub();
	const updateNotifierMock = sinon.stub();
	const logMock = sinon.stub();
	const metricsMock = sinon.stub();

	beforeEach(function() {
		fetchMock.reset();
		logMock.reset();
		updateNotifierMock.reset();
		metricsMock.reset();

		mockery.enable({
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		});

		mockery.registerMock('isomorphic-fetch', fetchMock);
		mockery.registerMock('./helpers/update-notifier', updateNotifierMock);
		mockery.registerMock('./helpers/log', logMock);
		mockery.registerMock('./helpers/metrics', metricsMock);

		mockery.registerAllowable(moduleUnderTest);

		mockery.resetCache();
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
