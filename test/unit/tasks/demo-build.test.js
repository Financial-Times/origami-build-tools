/* eslint-env mocha */
'use strict';

const expect = require('expect.js');
const process = require('process');
const fs = require('fs-extra');
const path = require('path');
const sinon = require('sinon');

const demo = require('../../../lib/tasks/demo-build');

const obtPath = process.cwd();
const oTestPath = 'test/unit/fixtures/o-test';
const oNoManifestPath = path.resolve(obtPath, 'test/unit/fixtures/o-no-manifest');
const pathSuffix = '-demo';
const demoTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

const sandbox = sinon.sandbox.create();

describe('Demo task', function () {

	beforeEach(function () {
		fs.copySync(path.resolve(obtPath, oTestPath), demoTestPath);
		process.chdir(demoTestPath);
	});

	afterEach(function () {
		process.chdir(obtPath);
		fs.removeSync(demoTestPath);
		sandbox.restore(); // restore all fakes created through the sandbox
	});

	describe('Build demos', function () {
		it('should fail if there is not a config file', function () {
			process.chdir(oNoManifestPath);
			fs.writeFileSync('bower.json', '{"name":"o-test"}', 'utf8');
			return demo()
				.then(() => {
					throw new Error('promise resolved when it should have rejected');
				}, function (err) {
					expect(err.message).to.be(`Couldn\'t find demos config path, checked: ${path.join(process.cwd(),'origami.json')}`);
					fs.unlinkSync(path.resolve(oNoManifestPath, 'bower.json'));
					process.chdir(demoTestPath);
				});
		});

		it('should error with a custom config file', function () {
			fs.writeFileSync('bower.json', '{"name":"o-test"}', 'utf8');
			fs.copySync('demos/src/config.json', 'demos/src/mysupercoolconfig.json');
			return demo({
				demoConfig: 'demos/src/mysupercoolconfig.json'
			})
				.then(() => {
					throw new Error('promise resolved when it should have rejected');
				}, function errorHandler(err) {
					// It will throw a template not found error which is fixed in "should build html" test
					expect(err.message).to.not.be('Couldn\'t find demos config path, checked: demos/src/mysupercoolconfigs.json');
				});
		});

		it('should not fail using origami.json', function () {
			return demo();
		});

		it('should fail if it\'s using the old config format', function () {
			return demo({
				demoConfig: 'demos/src/oldconfig.json'
			})
				.then(() => {
					throw new Error('promise resolved when it should have rejected');
				}, function () {
					expect(true).to.be.ok();
				});
		});

		it('should fail if there are demos with the same name', function () {
			const demoConfig = JSON.parse(fs.readFileSync('origami.json', 'utf8'));
			demoConfig.demos[1] = demoConfig.demos[0];
			fs.writeFileSync('origami.json', JSON.stringify(demoConfig));
			return demo()
				.then(() => {
					throw new Error('promise resolved when it should have rejected');
				}, function errorHandler(err) {
					expect(err.message).to.be('Demos with the same name were found. Give them unique names and try again.');
				});
		});

		it('should build demo html', function () {
			const request = require('request-promise-native');
			const demoDataLabel = 'Footer';
			sandbox.stub(request, 'get').callsFake(() => Promise.resolve({
				"label": demoDataLabel,
				"items": []
			}));
			addDemoToOrigamiConfig([{
				"name": "test1",
				"template": "demos/src/test1.mustache",
				"path": "/demos/test1.html",
				"description": "First test"
			}, {
				"name": "test2",
				"template": "demos/src/test2.mustache",
				"path": "/demos/test2.html",
				"hidden": true,
				"description": "Second test"
			}, {
				"name": "remote-data",
				"template": "demos/src/remote-data.mustache",
				"path": "/demos/remote-data.html",
				"description": "Third test",
				"data": "http://origami.ft.com/#stubedRequest"
			}]);
			fs.writeFileSync('demos/src/test1.mustache', '<div>test1</div>', 'utf8');
			fs.writeFileSync('demos/src/test2.mustache', '<div>test2</div>', 'utf8');
			fs.writeFileSync('demos/src/remote-data.mustache', '<div>{{{label}}}</div>', 'utf8');
			return demo({
				production: true
			}).then(function () {
				const test1 = fs.readFileSync('demos/test1.html', 'utf8');
				expect(test1).to.contain('<div>test1</div>');
				expect(test1).to.match(/\/v3\/polyfill\.min\.js\?features=.*promises/);
				const test2 = fs.readFileSync('demos/test2.html', 'utf8');
				expect(test2).to.contain('<div>test2</div>');
				expect(test2).to.match(/\/v3\/polyfill\.min\.js\?features=.*promises/);
				const testRemoteData = fs.readFileSync('demos/remote-data.html', 'utf8');
				expect(testRemoteData).to.contain(`<div>${demoDataLabel}</div>`);
				expect(testRemoteData).to.match(/\/v3\/polyfill\.min\.js\?features=.*promises/);
			});
		});

		it('should build local demos', function () {
			addDemoToOrigamiConfig([{
				"name": "test1",
				"template": "demos/src/test1.mustache",
				"path": "/demos/test1.html",
				"description": "First test"
			}, {
				"name": "test2",
				"template": "demos/src/test2.mustache",
				"path": "/demos/test2.html",
				"hidden": true,
				"description": "Second test"
			}]);
			fs.writeFileSync('demos/src/test1.mustache', '<div>test1</div>', 'utf8');
			fs.writeFileSync('demos/src/test2.mustache', '<div>test2</div>', 'utf8');
			return demo()
				.then(function () {
					expect(fs.readFileSync('demos/local/test1.html', 'utf8')).to.contain('<div>test1</div>');
					expect(fs.readFileSync('demos/local/test2.html', 'utf8')).to.contain('<div>test2</div>');
					expect(fs.readFileSync('demos/local/demo.js', 'utf8')).to.contain('function Test() {\n\tvar name = \'test\';');
					expect(fs.readFileSync('demos/local/demo.css', 'utf8')).to.contain('div {\n  color: blue; }\n');
					fs.removeSync('demos/local');
				});
		});

		it('should build local demos for brand', function () {
			addDemoToOrigamiConfig([{
				"name": "test1",
				"template": "demos/src/test1.mustache",
				"path": "/demos/test1.html",
				"description": "First test"
			}]);
			fs.writeFileSync('demos/src/test1.mustache', '<div>test1</div>', 'utf8');
			return demo({
				brand: 'internal'
			})
				.then(function () {
					expect(fs.readFileSync('demos/local/demo.css', 'utf8')).to.contain('div {\n  content: Brand is set to internal;\n  color: blue; }\n');
					fs.removeSync('demos/local');
				});
		});

		it('should fail if a remote url does not return valid json', function () {
			// Stub for invalid json.
			const request = require('request-promise-native');
			sandbox.stub(request, 'get').callsFake(() => Promise.resolve(`{
				"label": none valid json,
				"items": []}}}
			}`));
			// Create demo config.
			const remoteDataUrl = 'http://origami.ft.com/#stubedRequest';
			fs.writeFileSync('demos/src/remote-data.mustache', '<div>{{{label}}}</div>', 'utf8');
			addDemoToOrigamiConfig({
				"name": "remote-data",
				"template": "demos/src/remote-data.mustache",
				"path": "/demos/remote-data.html",
				"description": "Invalid remote data test",
				"data": remoteDataUrl
			});
			// Run invalid json test.
			return demo({
				production: true
			}).then(function () {
				throw new Error('promise resolved when it should have rejected');
			}).catch(function (err) {
				expect(err.message).to.be(`Could not load remote demo data. ${remoteDataUrl} did not provide valid JSON.`);
				expect(err.stack).to.be('');
			});
		});

		it('should fail if a remote url is invalid', function () {
			// Create invalid demo data config.
			const remoteDataUrl = 'https://!@£$%^&*()';
			addDemoToOrigamiConfig({
				"name": "remote-data",
				"template": "demos/src/remote-data.mustache",
				"path": "/demos/remote-data.html",
				"description": "Invalid url",
				"data": remoteDataUrl
			});
			// Run remote url test.
			return demo({
				production: true
			}).then(function () {
				throw new Error('promise resolved when it should have rejected');
			}).catch(function (err) {
				expect(err.message).to.be(`Could not load remote demo data. ${remoteDataUrl} does not appear to be valid.`);
				expect(err.stack).to.be('');
			});
		});

		it('should show a helpful error message for http status code errors', function () {
			// Stub for request/request-promise-native StatusCodeError.
			const request = require('request-promise-native');
			const mockHttpError = new Error('Mock StatusCodeError');
			mockHttpError.name = 'StatusCodeError';
			mockHttpError.statusCode = '500';
			sandbox.stub(request, 'get').callsFake(() => Promise.reject(mockHttpError));
			// Create demo config.
			const remoteDataUrl = 'http://origami.ft.com/#stubedRequest';
			addDemoToOrigamiConfig({
				"name": "remote-data",
				"template": "demos/src/remote-data.mustache",
				"path": "/demos/remote-data.html",
				"description": "Remote data url http error.",
				"data": remoteDataUrl
			});
			// Run error HTTP status code test. Tests the request/request-promise-native
			// error is caught and transformed, but not that the library throws the error.
			return demo({
				production: true
			}).then(function () {
				throw new Error('promise resolved when it should have rejected');
			}).catch(function (err) {
				expect(err.message).to.be(`Could not load remote demo data. ${remoteDataUrl} returned a ${mockHttpError.statusCode} status code.`);
				expect(err.stack).to.be('');
			});
		});

		it('should show a stack trace if remote demo data retrieval fails for an unknown reason', function () {
			// Stub for request/request-promise-native UnknownError.
			const request = require('request-promise-native');
			const mockHttpError = new Error('Mock Unknown Error');
			mockHttpError.name = 'UnknownError';
			sandbox.stub(request, 'get').callsFake(() => Promise.reject(mockHttpError));
			// Create demo config.
			const remoteDataUrl = 'http://origami.ft.com/#stubedRequest';
			addDemoToOrigamiConfig({
				"name": "remote-data",
				"template": "demos/src/remote-data.mustache",
				"path": "/demos/remote-data.html",
				"description": "Remote data url unknown error.",
				"data": remoteDataUrl
			});
			// Test for a stack trace.
			return demo({
				production: true
			}).then(function () {
				throw new Error('promise resolved when it should have rejected');
			}).catch(function (err) {
				expect(err.stack).not.to.be('');
			});
		});

		it('should throw an error if local demo data cannot be found', function () {
			fs.writeFileSync('demos/src/local-data.mustache', '<div>{{{label}}}</div>', 'utf8');
			const demoDataUri = 'demos/src/does-not-exist-data.mustache';
			// Create demo config.
			addDemoToOrigamiConfig({
				"name": "local-data",
				"template": "demos/src/local-data.mustache",
				"path": "/demos/local-data.html",
				"description": "Remote data url unknown error.",
				"data": demoDataUri
			});

			// Test for a "no local demo data" error.
			return demo({
				production: true
			}).then(function () {
				throw new Error('promise resolved when it should have rejected');
			}).catch(function (err) {
				expect(err.message).to.be(`Demo data not found: ${demoTestPath}/${demoDataUri}`);
			});
		});

		it('should load local partials', function () {
			addDemoToOrigamiConfig([
				{
					"name": "test1",
					"template": "demos/src/test1.mustache",
					"path": "/demos/test1.html",
					"description": "First test"
				}, {
					"name": "test2",
					"template": "demos/src/test2.mustache",
					"path": "/demos/test2.html",
					"hidden": true,
					"description": "Second test"
				}
			]);
			fs.writeFileSync('demos/src/test1.mustache', '<div>test1</div>{{>partial1}}', 'utf8');
			fs.writeFileSync('demos/src/test2.mustache', '<div>test1</div>{{>partials/partial2}}', 'utf8');
			return demo({
				production: true
			})
				.then(function () {
					const test1 = fs.readFileSync('demos/test1.html', 'utf8');
					const test2 = fs.readFileSync('demos/test2.html', 'utf8');
					expect(test1).to.contain('<div>partial1</div>');
					expect(test2).to.contain('<div>partial2</div>');
				});
		});

		function addDemoToOrigamiConfig (demosConfig) {
			if (!Array.isArray(demosConfig)) {
				demosConfig = [demosConfig];
			}
			const origamiConfig = JSON.parse(fs.readFileSync('origami.json', 'utf8'));
			demosConfig.forEach((demoConfig) => origamiConfig.demos.push(demoConfig));
			fs.writeFileSync('origami.json', JSON.stringify(origamiConfig));
		}
	});
});
