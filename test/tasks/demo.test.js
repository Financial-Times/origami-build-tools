/* global describe, it, before, after */
'use strict';

require('es6-promise').polyfill();
var expect = require('expect.js');
var gulp = require('gulp');
var extend = require('node.extend');

var fs = require('fs-extra');
var path = require('path');

var demo = require('../../lib/tasks/demo');

var obtPath = process.cwd();
var oTestPath = 'test/fixtures/o-test';
var pathSuffix = '-demo';
var demoTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

describe('Demo task', function() {

	before(function() {
		fs.copySync(path.resolve(obtPath, oTestPath), demoTestPath);
		process.chdir(demoTestPath);
	});

	after(function() {
		process.chdir(obtPath);
		fs.removeSync(demoTestPath);
	});

	describe('Run server', function() {
		it('should run a server', function(done) {
			demo.runServer(gulp)
				.then(function(server) {
					server.on('end', function() {
						done();
					});
				});
		});
	});

	describe('Build demos', function() {
		it('should fail if there is not a bower.json file', function() {
			return demo(gulp)
				.then(function() {
					throw new Error("No error thrown");
				}, function(err) {
					setTimeout(function() {
						expect(err).to.be('Couldn\'t find a bower.json file. Please add one and try again');
					});
				});
		});

		it('should fail if there is not a config file', function() {
			process.chdir(obtPath);
			fs.writeFileSync('bower.json', '{"name":"o-test"}', 'utf8');
			return demo(gulp)
				.then(function() {
					throw new Error("No error thrown");
				}, function(err) {
					setTimeout(function() {
						expect(err).to.be('Couldn\'t find demos config path, checked: demos/src/config.json,demos/src/config.js');
					});
					fs.unlink(path.resolve(obtPath, 'bower.json'));
					process.chdir(demoTestPath);
				});
		});

		it('should not error with a custom config file', function(done) {
			fs.writeFileSync('bower.json', '{"name":"o-test"}', 'utf8');
			fs.copySync('demos/src/config.json', 'demos/src/mysupercoolconfig.json');
			demo(gulp, {
				demoConfig: 'demos/src/mysupercoolconfig.json'
			}).catch(function(err) {
				setTimeout(function() {
					expect(err).to.not.be('Couldn\'t find demos config path, checked: demos/src/mysupercoolconfigs.json');
				});
				fs.unlink('demos/src/mysupercoolconfig.json');
				done();
			});
		});

		it('should not fail if there is a config.json file', function(done) {
			demo(gulp)
				.catch(function(err) {
					setTimeout(function() {
						expect(err).to.not.be('Couldn\'t find demos config path, checked: demos/src/config.json,demos/src/config.js');
					});
					done();
				});
		});

		it('should not fail if there is a config.js file', function(done) {
			var config = fs.readFileSync('demos/src/config.json');
			fs.writeFileSync('demos/src/config.js', 'module.exports = ' + config, 'utf8');
			demo(gulp)
				.catch(function(err) {
					setTimeout(function() {
						expect(err).to.not.be('Couldn\'t find demos config path, checked: demos/src/config.json,demos/src/config.js');
					});
					fs.unlink('demos/src/config.js');
					done();
				});
		});

		it('should not fail if it\'s using the old config format', function(done) {
			demo(gulp, {
				demoConfig: 'demos/src/oldconfig.json'
			})
			.catch(function(err) {
				setTimeout(function() {
					expect(err.toString()).to.be('Error: Demo template not found: ' + path.resolve(process.cwd(), 'demos/src/test1.mustache'));
				});
				done();
			});
		});

		it('should fail if there are demos with the same name', function(done) {
			var demoConfig = JSON.parse(fs.readFileSync('demos/src/config.json', 'utf8'));
			demoConfig.demos[1].name = 'test1';
			fs.writeFileSync('demos/src/config2.json', JSON.stringify(demoConfig));
			demo(gulp, {
				demoConfig: 'demos/src/config2.json'
			})
			.catch(function(err) {
				expect(err).to.be('Demos with the same name were found. Give them unique names and try again.');
				fs.unlink('demos/src/config2.json');
				done();
			});
		});

		it('should build demo html', function() {
			fs.writeFileSync('demos/src/test1.mustache', '<div>test1</div>', 'utf8');
			fs.writeFileSync('demos/src/test2.mustache', '<div>test2</div>', 'utf8');
			return demo(gulp)
				.then(function() {
					var test1 = fs.readFileSync('demos/test1.html', 'utf8');
					var test2 = fs.readFileSync('demos/test2.html', 'utf8');
					expect(test1).to.contain('<div>test1</div>');
					expect(test2).to.contain('<div>test2</div>');
					expect(test1).to.match(/\/v1\/polyfill\.min\.js\?features=.*promises/);
					expect(test2).to.match(/\/v1\/polyfill\.min\.js\?features=.*promises/);
					fs.unlink('demos/test1.html');
					fs.unlink('demos/test2.html');
				});
		});

		it('should build local demos', function() {
			return demo(gulp, {
				local: true
			})
			.then(function() {
				expect(fs.readFileSync('demos/local/test1.html', 'utf8')).to.contain('<div>test1</div>');
				expect(fs.readFileSync('demos/local/test2.html', 'utf8')).to.contain('<div>test2</div>');
				expect(fs.readFileSync('demos/local/demo.js', 'utf8')).to.contain('function Test() {\n\tvar name = \'test\';');
				expect(fs.readFileSync('demos/local/demo.css', 'utf8')).to.contain('div {\n  color: blue; }\n');
				fs.unlink('demos/test1.html');
				fs.unlink('demos/test2.html');
				fs.removeSync('demos/local');
			});
		});

		it('should update origami.json with demos', function(done) {
			var origamiConfig = fs.readFileSync('origami.json', 'utf8');
			demo(gulp, {
				updateorigami: true
			})
			.then(function() {
				var newOrigamiConfig = extend({}, JSON.parse(origamiConfig));
				var updatedOrigamiConfig = JSON.parse(fs.readFileSync('origami.json', 'utf8'));
				var demosConfig = [];
				demosConfig.push({"path": "/demos/test1.html", "expanded": true, "description": "First test"});
				demosConfig.push({"path": "/demos/test2.html", "expanded": false, "description": "Second test"});
				newOrigamiConfig.demos = demosConfig;
				expect(JSON.stringify(updatedOrigamiConfig)).to.be(JSON.stringify(newOrigamiConfig));
				fs.writeFileSync('origami.json', origamiConfig, 'utf8');
				fs.unlink('demos/test1.html');
				fs.unlink('demos/test2.html');
				done();
			});
		});
	});
});
