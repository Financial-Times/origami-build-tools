'use strict';

var path = require('path');
var sassdoc = require('gulp-sassdoc');
var extend = require('node.extend');

module.exports = function(gulp, config) {
	return module.exports.sassDoc(gulp, config);
};

module.exports.sassDoc = function(gulp, config) {
	config = config || {};
	var src = config.sassDir || '.';
	var sassdocConfig = {
		dest: path.join(src, '/docs/sass')
	};

	return gulp.src(src)
		.pipe(sassdoc(extend(true, {}, sassdocConfig, config)));
};

module.exports.watchable = true;
module.exports.description = 'Build module documentation into the docs/ directory';
