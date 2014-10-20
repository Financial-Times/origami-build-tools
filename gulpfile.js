'use strict';

var gulp = require('gulp');
var obt = require('./lib/origami-build-tools');

gulp.task('verify', function() {
	obt.verify(gulp, {
		js: 'lib/origami-build-tools.js',
		jsHintPath: '.jshintrc',
		editorconfigPath: '.editorconfig'
	});
});

gulp.task('test', function() {
	obt.test.npmTest(gulp);
});

gulp.task('watch', function() {
	gulp.watch('./lib/**/*', ['verify', 'test']);
});

gulp.task('default', ['verify', 'test', 'watch']);
