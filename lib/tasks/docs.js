'use strict';

var path = require('path'),
	sassdoc = require('gulp-sassdoc'),
	extend = require('node.extend'),
	files = require('../helpers/files');

module.exports = function(gulp, config) {
	module.exports.sassDoc(gulp, config);
};

module.exports.sassDoc = function(gulp, config) {
	config = config || {};
	var src = config.sassDir || '.';
	var sassdocConfig = {
		dest: path.join(src, '/docs/sass')
	};

	console.log(sassdocConfig);

	return gulp.src(src)
		.pipe(sassdoc(extend(true, {}, sassdocConfig, config)));
};

module.exports.watchable = true;
module.exports.description = 'Builds the documentation in the docs directory';
