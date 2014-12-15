'use strict';

var expect = require('expect.js');
var gulp = require('gulp');

var fs = require('fs');
var path = require('path');

var demo = require('../../lib/tasks/demo');
var oTestPath = 'test/fixtures/o-test';

describe('Demo task', function() {

	before(function() {
		process.chdir(oTestPath)
	});

	after(function() {
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
		xit('should fail if there is not a config file', function() {
			process.chdir('../../..');
			expect(function() {
				demo(gulp);
			}).to.throwException(/Couldn't find demos config path, checked: demos\/src\/config.json,demos\/src\/config.js/);
			process.chdir(oTestPath);
		});

		xit('should not error with a custom config file', function() {
			//fs.renameSync('demos/src/config.json', 'demos/src/mysupercoolconfig.json');
			expect(function() {
				demo(gulp, {
					//demoConfig: 'demos/src/mysupercoolconfig.json'
				});
			}).to.throwError();
			//fs.renameSync('demos/src/mysupercoolconfig.json', 'demos/src/config.json');
		});
	});
});
