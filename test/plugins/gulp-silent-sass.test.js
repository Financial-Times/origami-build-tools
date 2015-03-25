/* global describe, it */
'use strict';

var expect = require('expect.js');
var File = require('vinyl');

var silentSass = require('../../lib/plugins/gulp-silent-sass.js');

describe('Gulp silent Sass plugin', function() {
	it('Should succeed if silent is false and file has content', function(done) {
		var fakeFile = new File({
			contents: new Buffer('p{color:black;}')
		});

		var mySilentSass = silentSass({silent: false});
		mySilentSass.write(fakeFile);

		mySilentSass.once('end', function() {
			done();
		});

		mySilentSass.end();
	});

	it('Should fail if silent is true and file has content', function(done) {
		var fakeFile = new File({
			contents: new Buffer('p{color:black;}')
		});

		var mySilentSass = silentSass({silent: true});

		mySilentSass.on('error', function(error) {
			expect(error.message).to.be('sass compilation for silent mode: true failed.');
			done();
		});

		mySilentSass.write(fakeFile);
	});

	it('Should succeed if silent is true and file doesn not have content', function(done) {
		var fakeFile = new File({
			contents: new Buffer('')
		});

		var mySilentSass = silentSass({silent: true});
		mySilentSass.write(fakeFile);

		mySilentSass.once('end', function() {
			done();
		});

		mySilentSass.end();
	});

	it('Should fail if silent is false and file does not content', function(done) {
		var fakeFile = new File({
			contents: new Buffer('')
		});

		var mySilentSass = silentSass({silent: false});

		mySilentSass.on('error', function(error) {
			expect(error.message).to.be('sass compilation for silent mode: false failed.');
			done();
		});

		mySilentSass.write(fakeFile);
	});
});
