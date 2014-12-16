'use strict';

var expect = require('expect.js');
var gulp = require('gulp');

var fs = require('fs');
var path = require('path');

var demo = require('../../lib/tasks/demo');
var oTestPath = 'test/fixtures/o-test';

xdescribe('Demo task', function() {

	describe('Run server', function() {
		it('should run a server', function(done) {
			demo.runServer(gulp)
				.then(function(server) {
					server.on('end', function() {
						console.log('Done');
						done();
					});
				})
		});
	});

	describe('Build demos', function() {
		it('should fail if ', function(done) {

		});
	});
});
