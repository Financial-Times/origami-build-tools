/* eslint-env mocha, expect */
'use strict';

const expect = require('expect.js');
const mockery = require('mockery');
const sinon = require('sinon');

describe('construct-polyfill-url', function() {

	const moduleUnderTest = '../../lib/helpers/construct-polyfill-url';

	const globby = sinon.stub();
	let constructPolyfillUrl;

	beforeEach(function() {

		mockery.enable({
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		});

		mockery.registerMock('globby', globby);

		mockery.registerAllowable(moduleUnderTest);

		mockery.resetCache();
		constructPolyfillUrl = require(moduleUnderTest);
	});

	after(() => {
		mockery.resetCache();
		mockery.deregisterAll();
		mockery.disable();
	});

	it('exports a function', function() {
		expect(typeof constructPolyfillUrl).to.equal('function');
	});

	it('returns a rejected promise if globby returns a rejected promise', () => {
		globby.rejects();

		return constructPolyfillUrl()
			.then(() => {
				expect().fail();
			}, () => {
				expect(true).ok();
			});
	});

	describe('when globby finds no files', () => {
		it('returns a polyfill url with only the default polyfill set', () => {
			globby.resolves([]);

			return constructPolyfillUrl()
				.then(polyfillUrl => {
					expect(polyfillUrl).to.equal('https://polyfill.io/v2/polyfill.js?features=default&flags=gated&unknown=polyfill');
				});
		});
	});

	describe('when globby finds files', () => {
		describe('files do not contain a browserFeatures field', () => {
			it('returns a polyfill url with only the default polyfill set', () => {
				mockery.registerMock('/origami.json', {});
				globby.resolves(['/origami.json']);

				return constructPolyfillUrl()
					.then(polyfillUrl => {
						expect(polyfillUrl).to.equal('https://polyfill.io/v2/polyfill.js?features=default&flags=gated&unknown=polyfill');
					});
			});
		});

		describe('files do not contain a required field in the browserFeatures object', () => {
			it('returns a polyfill url with only the default polyfill set', () => {
				mockery.registerMock('/origami.json', {
					browserFeatures: {}
				});
				globby.resolves(['/origami.json']);

				return constructPolyfillUrl()
					.then(polyfillUrl => {
						expect(polyfillUrl).to.equal('https://polyfill.io/v2/polyfill.js?features=default&flags=gated&unknown=polyfill');
					});
			});
		});

		describe('files do contain a required array in the browserFeatures object', () => {
			it('returns a polyfill url with the default polyfill set and the features in the required array', () => {
				mockery.registerMock('/origami.json', {
					browserFeatures: {
						required: [
							'Array.prototype.every'
						]
					}
				});
				globby.resolves(['/origami.json']);

				return constructPolyfillUrl()
					.then(polyfillUrl => {
						expect(polyfillUrl).to.equal('https://polyfill.io/v2/polyfill.js?features=default,Array.prototype.every&flags=gated&unknown=polyfill');
					});
			});

			it('does not duplicate features in the polyfill url', () => {
				mockery.registerMock('/origami.json', {
					browserFeatures: {
						required: [
							'Array.prototype.every'
						]
					}
				});
				mockery.registerMock('/bower_components/example/origami.json', {
					browserFeatures: {
						required: [
							'Array.prototype.every',
							'Array.prototype.some'
						]
					}
				});
				globby.resolves(['/origami.json', '/bower_components/example/origami.json']);

				return constructPolyfillUrl()
					.then(polyfillUrl => {
						expect(polyfillUrl).to.equal('https://polyfill.io/v2/polyfill.js?features=default,Array.prototype.every,Array.prototype.some&flags=gated&unknown=polyfill');
					});
			});

			describe('required array is empty', () => {
				it('returns a polyfill url with only the default polyfill set', () => {
					mockery.registerMock('/origami.json', {
						browserFeatures: {
							required: []
						}
					});
					globby.resolves(['/origami.json']);

					return constructPolyfillUrl()
						.then(polyfillUrl => {
							expect(polyfillUrl).to.equal('https://polyfill.io/v2/polyfill.js?features=default&flags=gated&unknown=polyfill');
						});
				});
			});
		});
	});
});
