'use strict';

var commandLine = require('/lib/helpers/command-line');

describe('Command line helper', function() {
	it('should return output from stdout', function(done) {
		commandLine.run('echo', ['test']).then(function(output) {
			expect(output.stdout).to.be('hi');
			done();
		});
	});
});
