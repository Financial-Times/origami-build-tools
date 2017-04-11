/* global describe, it */
'use strict';

const expect = require('expect.js');

const commandLine = require('../../lib/helpers/command-line');

describe('Command line helper', function() {
	it('should return output from stdout', function() {
		return commandLine.run('echo', ['test']).then(function(output) {
			expect(output.stdout).to.be('test');
		});
	});

	it('should return output from stderr', function() {
		return commandLine.run('node', ['error']).then(function () { }, function (output) {
			expect(output.stderr).to.contain('throw err;');
			expect(output.code).to.be(1);
		});
	});
});
