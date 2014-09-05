var gulp = require('gulp');
require('./tasks')(gulp);
var customTasks = require('./customtasks')(gulp);
// gulp.start will be removed in 0.4, but there will be an alternative, possibly using orchestrator
gulp.start('hi');
gulp.src('lol.js')
	.pipe(gulp.dest('build'));

gulp.task('customTask', function() {
	console.log('???');
	customTasks(gulp);
});