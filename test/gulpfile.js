var gulp = require('gulp');

var obt = require('../lib/origami-build-tools');

gulp.task('verify', function() {
	obt.verify(gulp);
});