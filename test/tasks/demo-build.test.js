/* eslint-env mocha */
'use strict';

const expect = require('expect.js');
const process = require('process');
const fs = require('fs-extra');
const path = require('path');

const demo = require('../../lib/tasks/demo-build');

const obtPath = process.cwd();
const oTestPath = 'test/fixtures/o-test';
const pathSuffix = '-demo';
const demoTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

describe('Demo task', function () {

	beforeEach(function () {
		fs.copySync(path.resolve(obtPath, oTestPath), demoTestPath);
		process.chdir(demoTestPath);
	});

	afterEach(function () {
		process.chdir(obtPath);
		fs.removeSync(demoTestPath);
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
					fs.unlinkSync('demos/src/mysupercoolconfig.json');
				});
		});

		it('should not fail using origami.json', function () {
			return demo();
		});

		it.skip('should fail if there is a config.json file', function () {
			// TODO implement this
		});

		it.skip('should fail if there is a config.js file', function () {
			// TODO implement this
			// const config = fs.readFileSync('demos/src/config.json');
			// fs.writeFileSync('demos/src/config.js', 'module.exports = ' + config, 'utf8');
			// return demo()
			// 	.then(() => {
			// 		throw new Error('promise resolved when it should have rejected');
			// 	}, function () {
			// 		expect(true).to.be.ok();
			// 	});
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
			return demo({
				dist: true
			})
				.then(function () {
					const test1 = fs.readFileSync('demos/test1.html', 'utf8');
					const test2 = fs.readFileSync('demos/test2.html', 'utf8');
					expect(test1).to.contain('<div>test1</div>');
					expect(test2).to.contain('<div>test2</div>');
					expect(test1).to.match(/\/v2\/polyfill\.min\.js\?features=.*promises/);
					expect(test2).to.match(/\/v2\/polyfill\.min\.js\?features=.*promises/);
					fs.unlinkSync('demos/test1.html');
					fs.unlinkSync('demos/test2.html');
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
				dist: true
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
