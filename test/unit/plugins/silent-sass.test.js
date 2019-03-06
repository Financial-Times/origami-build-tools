/* eslint-env mocha */
'use strict';

const proclaim = require('proclaim');

const silentSass = require('../../../lib/plugins/silent-sass.js');

describe('Silent Sass', function () {
	it('Should succeed if silent is false and file has content', function () {
		const fakeFile = Buffer.from('p{color:black;}');

		proclaim.doesNotThrow(() => silentSass({
			silent: false
		})(fakeFile));
	});

	it('Should fail if silent is true and file has content', function () {
		const fakeFile = Buffer.from('p{color:black;}');

		const mySilentSass = silentSass({
			silent: true
		});

		proclaim.throws(() => mySilentSass(fakeFile), 'CSS was output with silent mode on.');
	});

	it('Should succeed if silent is true and file doesn not have content', function () {
		const fakeFile = Buffer.from('');

		proclaim.doesNotThrow(() => silentSass({
			silent: true
		})(fakeFile));
	});
});
