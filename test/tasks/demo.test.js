/* global describe, it, before, after */
'use strict';

const expect = require('expect.js');
const gulp = require('gulp');

const fs = require('fs-extra');
const path = require('path');

const demo = require('../../lib/tasks/demo');

const obtPath = process.cwd();
const oTestPath = 'test/fixtures/o-test';
const pathSuffix = '-demo';
const demoTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

describe('Demo task', () => {

	before(function() {
		fs.copySync(path.resolve(obtPath, oTestPath), demoTestPath);
		process.chdir(demoTestPath);
	});

	after(function() {
		process.chdir(obtPath);
		fs.removeSync(demoTestPath);
	});

	describe('Run server', () => {
		it('should run a server', (done) => {
			demo.runServer(gulp)
				.then(function(server) {
					server.on('end', () => {
						done();
					});
				});
		});
	});

	describe('Build demos', () => {
		it('should fail if there is not a config file', (done) => {
			process.chdir(obtPath);
			fs.writeFileSync('bower.json', '{"name":"o-test"}', 'utf8');
			demo(gulp)
				.on('error', (err) => {
					expect(err.message).to.be('Couldn\'t find demos config path, checked: demos/src/config.json,demos/src/config.js,origami.json');
					fs.unlink(path.resolve(obtPath, 'bower.json'));
					process.chdir(demoTestPath);
					done();
				});
		});

		it('should not error with a custom config file', (done) => {
			fs.writeFileSync('bower.json', '{"name":"o-test"}', 'utf8');
			fs.copySync('demos/src/config.json', 'demos/src/mysupercoolconfig.json');
			const demoStream = demo(gulp, {
				demoConfig: 'demos/src/mysupercoolconfig.json'
			})
			.on('error', function errorHandler(err) {
				// It will throw a template not found error which is fixed in "should build html" test
				expect(err.message).to.not.be('Couldn\'t find demos config path, checked: demos/src/mysupercoolconfigs.json');
				fs.unlink('demos/src/mysupercoolconfig.json');
				demoStream.removeListener('error', errorHandler);
				done();
			});
		});

		it('should not fail if there is a config.json file', (done) => {
			const demoStream = demo(gulp)
				.on('error', function errorHandler(err) {
						// It will throw a template not found error which is fixed in "should build html" test
						expect(err.message).to.not.be('Couldn\'t find demos config path, checked: demos/src/config.json,demos/src/config.js,origami.json');
						demoStream.removeListener('error', errorHandler);
						done();
					});
		});

		it('should not fail if there is a config.js file', (done) => {
			const config = fs.readFileSync('demos/src/config.json');
			fs.writeFileSync('demos/src/config.js', 'module.exports = ' + config, 'utf8');
			const demoStream = demo(gulp)
				.on('error', function errorHandler(err) {
						// It will throw a template not found error which is fixed in "should build html" test
						expect(err.message).to.not.be('Couldn\'t find demos config path, checked: demos/src/config.json,demos/src/config.js,origami.json');
						fs.unlink('demos/src/config.js');
						demoStream.removeListener('error', errorHandler);
						done();
					});
		});

		it('should not fail using origami.json', (done) => {
			const demoStream = demo(gulp, {
				demoConfig: 'origami.json'
			})
			.on('error', function errorHandler(err) {
				// It will throw a template not found error which is fixed in "should build html" test
				expect(err.message).to.not.be('Couldn\'t find demos config path, checked: origami.json');
				demoStream.removeListener('error', errorHandler);
				done();
			})
		});

		it('should not fail if it\'s using the old config format', (done) => {
			const demoStream = demo(gulp, {
				demoConfig: 'demos/src/oldconfig.json'
			})
			.on('error', function errorHandler(err) {
				expect(err.message).to.be('Demo template not found: ' + path.resolve(process.cwd(), 'demos/src/test1.mustache'));
				demoStream.removeListener('error', errorHandler);
				done();
			});
		});

		it('should fail if there are demos with the same name', (done) => {
			const demoConfig = JSON.parse(fs.readFileSync('demos/src/config.json', 'utf8'));
			demoConfig.demos[1].name = 'test1';
			fs.writeFileSync('demos/src/config2.json', JSON.stringify(demoConfig));
			const demoStream = demo(gulp, {
				demoConfig: 'demos/src/config2.json'
			})
			.on('error', function errorHandler(err) {
				expect(err.message).to.be('Demos with the same name were found. Give them unique names and try again.');
				fs.unlink('demos/src/config2.json');
				demoStream.removeListener('error', errorHandler);
				done();
			});
		});

		it('should build demo html', (done) => {
			fs.writeFileSync('demos/src/test1.mustache', '<div>test1</div>', 'utf8');
			fs.writeFileSync('demos/src/test2.mustache', '<div>test2</div>', 'utf8');
			const demoStream = demo(gulp)
			.on('end', () => {
					const test1 = fs.readFileSync('demos/test1.html', 'utf8');
					const test2 = fs.readFileSync('demos/test2.html', 'utf8');
					expect(test1).to.contain('<div>test1</div>');
					expect(test2).to.contain('<div>test2</div>');
					expect(test1).to.match(/\/v1\/polyfill\.min\.js\?features=.*promises/);
					expect(test2).to.match(/\/v1\/polyfill\.min\.js\?features=.*promises/);
					fs.unlink('demos/test1.html');
					fs.unlink('demos/test2.html');
					done();
				});

			demoStream.resume();
		});

		it('should build local demos', (done) => {
			const demoStream = demo(gulp, {
				local: true
			})
			.on('end', () => {
				expect(fs.readFileSync('demos/local/test1.html', 'utf8')).to.contain('<div>test1</div>');
				expect(fs.readFileSync('demos/local/test2.html', 'utf8')).to.contain('<div>test2</div>');
				expect(fs.readFileSync('demos/local/demo.js', 'utf8')).to.contain('function Test() {\n\t\tvar name = \'test\';');
				expect(fs.readFileSync('demos/local/demo.css', 'utf8')).to.contain('div {\n  color: blue; }\n');
				fs.unlink('demos/test1.html');
				fs.unlink('demos/test2.html');
				fs.removeSync('demos/local');
				done();
			});

			demoStream.resume();
		});
	});
});
