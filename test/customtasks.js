module.exports = function customTask(gulp) {
	console.log('running');
	return gulp.src('tasks.js')
		.pipe(gulp.dest('build'));
};