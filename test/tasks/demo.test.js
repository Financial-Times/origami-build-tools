'use strict';

var expect = require('expect.js');
var gulp = require('gulp');
var extend = require('node.extend');
var rimraf = require('rimraf');

var fs = require('fs');
var path = require('path');

var demo = require('../../lib/tasks/demo');
var oTestPath = 'test/fixtures/o-test';

describe('Demo task', function() {

	before(function() {
		process.chdir(oTestPath)
	});

	after(function() {
		fs.unlink('demos/src/test1.mustache');
		fs.unlink('demos/src/test2.mustache');
		fs.unlink('bower.json');
		process.chdir('../../..');
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
		it('should fail if there is not a bower.json file', function(done) {
			demo(gulp)
				.catch(function(err) {
					setTimeout(function() {
						expect(err).to.be('Couldn\'t find a bower.json file. Please add one and try again');
					});
					done();
				});
		});

		it('should fail if there is not a config file', function(done) {
			process.chdir('../../..');
			fs.writeFileSync('bower.json', '{"name":"o-test"}', 'utf8');
			demo(gulp)
				.catch(function(err) {
					setTimeout(function() {
						expect(err).to.be('Couldn\'t find demos config path, checked: demos/src/config.json,demos/src/config.js');
					});
					fs.unlink('bower.json');
					process.chdir(oTestPath);
					done();
				});
		});

		it('should not error with a custom config file', function(done) {
			fs.writeFileSync('bower.json', '{"name":"o-test"}', 'utf8');
			fs.renameSync('demos/src/config.json', 'demos/src/mysupercoolconfig.json');
			demo(gulp, {
				demoConfig: 'demos/src/mysupercoolconfig.json'
			}).catch(function(err) {
				setTimeout(function() {
					expect(err).to.not.be('Couldn\'t find demos config path, checked: demos/src/mysupercoolconfigs.json');
				});
				fs.renameSync('demos/src/mysupercoolconfig.json', 'demos/src/config.json');
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

		it('should build demo html', function(done) {
			fs.writeFileSync('demos/src/test1.mustache', '<div>test1</div>', 'utf8');
			fs.writeFileSync('demos/src/test2.mustache', '<div>test2</div>', 'utf8');
			demo(gulp)
				.then(function() {
					expect(fs.readFileSync('demos/test1.html', 'utf8')).to.contain('<div>test1</div>');
					expect(fs.readFileSync('demos/test2.html', 'utf8')).to.contain('<div>test2</div>');
					fs.unlink('demos/test1.html');
					fs.unlink('demos/test2.html');
					done();
				});
		});

		it('should build local demos', function(done) {
			demo(gulp, {
				local: true
			})
			.then(function() {
				expect(fs.readFileSync('demos/local/test1.html', 'utf8')).to.contain('<div>test1</div>');
				expect(fs.readFileSync('demos/local/test2.html', 'utf8')).to.contain('<div>test2</div>');
				expect(fs.readFileSync('demos/local/demo.js', 'utf8')).to.contain('function Test() {\n\tvar name = \'test\';\n};');
				expect(fs.readFileSync('demos/local/demo.css', 'utf8')).to.be('div{color:blue}\n');
				fs.unlink('demos/test1.html');
				fs.unlink('demos/test2.html');
				rimraf.sync('demos/local');
				done();
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
