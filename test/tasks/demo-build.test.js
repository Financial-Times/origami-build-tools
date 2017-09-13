/* eslint-env mocha */
'use strict';

const expect = require('expect.js');
const process = require('process');
const fs = require('fs-extra');
const path = require('path');
const sinon = require('sinon');

const demo = require('../../lib/tasks/demo-build');

const obtPath = process.cwd();
const oTestPath = 'test/fixtures/o-test';
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
			process.chdir(obtPath);
			fs.writeFileSync('bower.json', '{"name":"o-test"}', 'utf8');
			return demo()
				.then(() => {
					throw new Error('promise resolved when it should have rejected');
				}, function (err) {
					expect(err.message).to.be(`Couldn\'t find demos config path, checked: ${path.join(process.cwd(),'origami.json')}`);
					fs.unlinkSync(path.resolve(obtPath, 'bower.json'));
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

			const demoConfig = JSON.parse(fs.readFileSync('origami.json', 'utf8'));
			demoConfig.demos.push({
				"name": "test1",
				"template": "demos/src/test1.mustache",
				"path": "/demos/test1.html",
				"description": "First test"
			});
			demoConfig.demos.push({
				"name": "test2",
				"template": "demos/src/test2.mustache",
				"path": "/demos/test2.html",
				"hidden": true,
				"description": "Second test"
			});
			demoConfig.demos.push({
				"name": "remote-data",
				"template": "demos/src/remote-data.mustache",
				"path": "/demos/remote-data.html",
				"description": "Third test",
				"data": "http://origami.ft.com/#stubedRequest"
			});
			fs.writeFileSync('origami.json', JSON.stringify(demoConfig));
			fs.writeFileSync('demos/src/test1.mustache', '<div>test1</div>', 'utf8');
			fs.writeFileSync('demos/src/test2.mustache', '<div>test2</div>', 'utf8');
			fs.writeFileSync('demos/src/remote-data.mustache', '<div>{{{label}}}</div>', 'utf8');
			return demo({
				production: true
			}).then(function () {
				const test1 = fs.readFileSync('demos/test1.html', 'utf8');
				const test2 = fs.readFileSync('demos/test2.html', 'utf8');
				const testRemoteData = fs.readFileSync('demos/remote-data.html', 'utf8');
				expect(test1).to.contain('<div>test1</div>');
				expect(test2).to.contain('<div>test2</div>');
				expect(testRemoteData).to.contain(`<div>${demoDataLabel}</div>`);
				expect(test1).to.match(/\/v2\/polyfill\.min\.js\?features=.*promises/);
				expect(test2).to.match(/\/v2\/polyfill\.min\.js\?features=.*promises/);
				expect(testRemoteData).to.match(/\/v2\/polyfill\.min\.js\?features=.*promises/);
				fs.unlinkSync('demos/test1.html');
				fs.unlinkSync('demos/test2.html');
				fs.unlinkSync('demos/remote-data.html');
				request.get.restore();
			});
		});

		it('should build local demos', function () {
			const demoConfig = JSON.parse(fs.readFileSync('origami.json', 'utf8'));
			demoConfig.demos.push({
				"name": "test1",
				"template": "demos/src/test1.mustache",
				"path": "/demos/test1.html",
				"description": "First test"
			});
			demoConfig.demos.push({
				"name": "test2",
				"template": "demos/src/test2.mustache",
				"path": "/demos/test2.html",
				"hidden": true,
				"description": "Second test"
			});
			fs.writeFileSync('origami.json', JSON.stringify(demoConfig));
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

		it('should fail if a remote url does not return valid json', function () {
			// Stub for invalid json.
			const request = require('request-promise-native');
			sandbox.stub(request, 'get').callsFake(() => Promise.resolve(`{
				"label": none valid json,
				"items": []}}}
			}`));
			// Create demo config.
			const demoConfig = JSON.parse(fs.readFileSync('origami.json', 'utf8'));
			const remoteDataUrl = 'http://origami.ft.com/#stubedRequest';
			fs.writeFileSync('demos/src/remote-data.mustache', '<div>{{{label}}}</div>', 'utf8');
			demoConfig.demos.push({
				"name": "remote-data",
				"template": "demos/src/remote-data.mustache",
				"path": "/demos/remote-data.html",
				"description": "Invalid remote data test",
				"data": remoteDataUrl
			});
			fs.writeFileSync('origami.json', JSON.stringify(demoConfig));
			// Run invalid json test.
			return demo({
				production: true
			}).then(function () {
				throw new Error('promise resolved when it should have rejected');
			}).catch(function (err) {
				expect(err.message).to.be(`Could not load remote demo data. ${remoteDataUrl} did not provide valid JSON.`);
			});
		});

		it('should fail if a remote url is invalid', function () {
			// Create demo config.
			const demoConfig = JSON.parse(fs.readFileSync('origami.json', 'utf8'));
			const remoteDataUrl = 'https://!@£$%^&*()';
			fs.writeFileSync('demos/src/remote-data.mustache', '<div>{{{label}}}</div>', 'utf8');
			demoConfig.demos.push({
				"name": "remote-data",
				"template": "demos/src/remote-data.mustache",
				"path": "/demos/remote-data.html",
				"description": "Invalid url",
				"data": remoteDataUrl
			});
			fs.writeFileSync('origami.json', JSON.stringify(demoConfig));
			// Run remote url test.
			return demo({
				production: true
			}).then(function () {
				throw new Error('promise resolved when it should have rejected');
			}).catch(function (err) {
				expect(err.message).to.be(`Could not load remote demo data. ${remoteDataUrl} does not appear to be valid.`);
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
			const demoConfig = JSON.parse(fs.readFileSync('origami.json', 'utf8'));
			const remoteDataUrl = 'http://origami.ft.com/#stubedRequest';
			fs.writeFileSync('demos/src/remote-data.mustache', '<div>{{{label}}}</div>', 'utf8');
			demoConfig.demos.push({
				"name": "remote-data",
				"template": "demos/src/remote-data.mustache",
				"path": "/demos/remote-data.html",
				"description": "Remote data url http error.",
				"data": remoteDataUrl
			});
			fs.writeFileSync('origami.json', JSON.stringify(demoConfig));
			// Error HTTP status code.
			return demo({
				production: true
			}).then(function () {
				throw new Error('promise resolved when it should have rejected');
			}).catch(function (err) {
				expect(err.message).to.be(`Could not load remote demo data. ${remoteDataUrl} returned a ${mockHttpError.statusCode} status code.`);
			});
		});

		it('should load local partials', function () {
			const demoConfig = JSON.parse(fs.readFileSync('origami.json', 'utf8'));
			demoConfig.demos.push({
				"name": "test1",
				"template": "demos/src/test1.mustache",
				"path": "/demos/test1.html",
				"description": "First test"
			});
			demoConfig.demos.push({
				"name": "test2",
				"template": "demos/src/test2.mustache",
				"path": "/demos/test2.html",
				"hidden": true,
				"description": "Second test"
			});
			fs.writeFileSync('origami.json', JSON.stringify(demoConfig));
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
					fs.unlinkSync('demos/test1.html');
					fs.unlinkSync('demos/test2.html');
				});
		});
	});
});
