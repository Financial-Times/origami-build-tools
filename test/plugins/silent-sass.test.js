/* eslint-env mocha */
'use strict';

const expect = require('expect.js');

const silentSass = require('../../lib/plugins/silent-sass.js');

describe('Silent Sass', function() {
	it('Should succeed if silent is false and file has content', function(done) {
		const fakeFile = new Buffer('p{color:black;}');

		const mySilentSass = silentSass({silent: false});
		mySilentSass.write(fakeFile);

		mySilentSass.once('end', function() {
			done();
		});

		mySilentSass.end();
	});

	it('Should fail if silent is true and file has content', function(done) {
		const fakeFile = new Buffer('p{color:black;}');

		const mySilentSass = silentSass({silent: true});

		mySilentSass.on('error', function(error) {
			expect(error.message).to.be('sass compilation for silent mode: true failed.');
			done();
		});

		mySilentSass.write(fakeFile);
	});

	it('Should succeed if silent is true and file doesn not have content', function(done) {
		const fakeFile = new Buffer('');

		const mySilentSass = silentSass({silent: true});
		mySilentSass.write(fakeFile);

		mySilentSass.once('end', function() {
			done();
		});

		mySilentSass.end();
	});

	it('Should fail if silent is false and file does not content', function(done) {
		const fakeFile = new Buffer('');

		const mySilentSass = silentSass({silent: false});

		mySilentSass.on('error', function(error) {
			expect(error.message).to.be('sass compilation for silent mode: false failed.');
			done();
		});

		mySilentSass.write(fakeFile);
	});
});