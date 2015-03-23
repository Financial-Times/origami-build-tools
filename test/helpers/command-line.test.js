/* global xdescribe, it */
'use strict';

var expect = require('expect.js');
require('es6-promise').polyfill();

var commandLine = require('../../lib/helpers/command-line');

xdescribe('Command line helper', function() {
	it('should return output from stdout', function(done) {
		commandLine.run('echo', ['test']).then(function(output) {
			expect(output.stdout).to.be('test\n');
			done();
		});
	});

	it('should return output from stderr', function(done) {
		commandLine.run('node', ['error']).then(function() {}, function(output) {
			expect(output.stderr).to.contain('throw err;\n');
			expect(output.err).to.be(8);
			done();
		});
	});
});
