'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var obt = require('./lib/origami-build-tools');

gulp.task('verify', function() {
	return gulp.src(['**/*.js'].concat('!node_modules/**'))
        .pipe(jshint(__dirname + '/.jshintrc'))
        .pipe(jshint.reporter('default'));
});

gulp.task('test', function() {
	obt.test.npmTest(gulp);
});

gulp.task('watch', function() {
	gulp.watch('./lib/**/*', ['verify', 'test']);
});

gulp.task('default', ['verify', 'test', 'watch']);