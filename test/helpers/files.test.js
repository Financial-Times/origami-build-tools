'use strict';

var expect = require('expect.js');
require('es6-promise').polyfill();

var files = require('../../lib/helpers/files');

describe('Files helper', function() {
	it('should return correct build folder', function() {
		expect(files.getBuildFolderPath()).to.be(process.cwd() + '/build/');
	});
});
