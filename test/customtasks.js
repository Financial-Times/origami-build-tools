module.exports = function(gulp) {
	return {
		task1: function() {
			console.log('running');
			return gulp.src('tasks.js')
				.pipe(gulp.dest('build'))
		}
	}
};
