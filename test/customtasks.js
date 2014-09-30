module.exports = {
	task1: function(gulp) {
		console.log('running');
		return gulp.src('tasks.js')
			.pipe(gulp.dest('build'))
	}
};
