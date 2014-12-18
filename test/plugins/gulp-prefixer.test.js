// Code based on https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/testing.md
'use strict';

var expect = require('expect.js');
var File = require('vinyl');

var prefixer = require('../../lib/plugins/gulp-prefixer.js');

describe('gulp-prefixer', function() {
	describe('in buffer mode', function() {

		it('should prepend text', function(done) {

			var fakeFile = new File({
				contents: new Buffer('abufferwiththiscontent')
			});

			var myPrefixer = prefixer('prependthis');

			myPrefixer.write(fakeFile);

			myPrefixer.once('data', function(file) {
				expect(file.isBuffer()).to.be(true);
				expect(file.contents.toString('utf8')).to.be('prependthisabufferwiththiscontent');
				done();
			});

		});

	});
});
