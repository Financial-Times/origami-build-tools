/* global describe, it */
'use strict';

const expect = require('expect.js');

const commandLine = require('../../lib/helpers/command-line');

describe('Command line helper', function() {
	it('should return output from stdout', function(done) {
		commandLine.run('echo', ['test']).then(function(output) {
			expect(output.stdout).to.be('test\n');
			done();
		});
	});

	it('should return output from stderr', function(done) {
		commandLine.run('node', ['error']).then(function() {}, function(output) {
			expect(output.stderr).to.contain('throw err;\n');
			expect(output.err).to.be(1);
			done();
		});
	});
});
