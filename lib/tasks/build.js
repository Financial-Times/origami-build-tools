'use strict';

module.exports = function (gulp, config) {
	const merge = require('merge-stream');
	let jsStream;
	let sassStream;
	const buildStream = merge();
	const emitBuildStreamErrorEvent = buildStream.emit.bind(buildStream, 'error');
	if (typeof config.watching === 'undefined' || config.watching === 'js') {
		jsStream = module.exports.js(gulp, config);

		if (typeof jsStream !== 'undefined') {
			jsStream.on('error', emitBuildStreamErrorEvent);
		}
	}
	if (typeof config.watching === 'undefined' || config.watching === 'sass') {
		sassStream = module.exports.sass(gulp, config);

		if (typeof sassStream !== 'undefined') {
			sassStream.on('error', emitBuildStreamErrorEvent);
		}
	}
	if (jsStream && sassStream) {
		buildStream.add(jsStream, sassStream);
		return buildStream;
	}
	return jsStream || sassStream;
};

module.exports.js = function (gulp, config) {
	const files = require('../helpers/files');
	const src = files.getMainJsPath();

	if (src) {
		const combine = require('stream-combiner2');
		const log = require('../helpers/log');

		const webpack = require('webpack-stream');
		const wp = require('webpack');

		const webpackConfig = (config.flags.production) ? require('../../config/webpack.config.prod') : require('../../config/webpack.config.dev');

		if (config.flags.buildjs) {
			webpackConfig.output.filename = config.flags.buildjs;
		} else {
			webpackConfig.output.filename = 'main.js';
		}

		if (config.flags.standalone) {
			webpackConfig.output.library = config.flags.standalone;
		}

		const destFolder = files.getBuildFolderPath();

		log.secondary('Webpacking ' + src);

		const combinedStream = combine.obj(
			gulp.src(src),
			webpack(webpackConfig, wp),
			gulp.dest(destFolder)
		);

		// Returns a combined stream so an error handler can be attached to the end of the pipeline,
		// and it will have effects in all the steps. We need to resume() because stream-combiner2
		// seems to pause the stream and it doesn't reach the `end` event
		return combinedStream.resume();
	}
};

module.exports.sass = function (gulp, config) {
	const path = require('path');

	const combine = require('stream-combiner2');
	const sass = require('gulp-sass');
	const sourcemaps = require('gulp-sourcemaps');
	const cleanCss = require('gulp-clean-css');
	const rename = require('gulp-rename');
	const gulpif = require('gulp-if-else');
	const autoprefixer = require('gulp-autoprefixer');
	const prefixer = require('../plugins/gulp-prefixer');
	const files = require('../helpers/files');
	const log = require('../helpers/log');
	config = config || {};
	const src = config.sass || files.getMainSassPath() || null;
	const cwd = config.cwd || process.cwd();

	if (src) {
		const destFolder = config.buildFolder || files.getBuildFolderPath();
		const dest = config.buildCss || 'main.css';

		log.secondary('Compiling ' + src);

		config.env = config.env || 'development';
		const useSourceMaps = config.sourcemaps || (config.env === 'development');

		const sassConfig = {
			includePaths: [path.join(cwd, 'bower_components')].concat(config.sassIncludePaths || []),
			outputStyle: 'nested'
		};

		const autoprefixerConfig = {
			browsers: config.autoprefixerBrowsers || ['> 1%', 'last 2 versions', 'ie > 6', 'ff ESR', 'bb >= 7'],
			cascade: config.autoprefixerCascade || false,
			flexbox: 'no-2009',
			remove: config.autoprefixerRemove === undefined ? true : config.autoprefixerRemove
		};

		const combinedStream = combine.obj(
			gulp.src(src),
			gulpif(config.sassPrefix, function () {
				return prefixer(config.sassPrefix);
			}),
			gulpif(useSourceMaps, function () {
				return sourcemaps.init();
			}),
			sass(sassConfig),
			autoprefixer(autoprefixerConfig),
			gulpif(config.env === 'production', function () {
				return cleanCss(config.cleanCss || {
					advanced: false,
					compatibility: 'ie8'
				});
			}),
			gulpif(useSourceMaps, function () {
				if (useSourceMaps === 'inline') {
					return sourcemaps.write();
				} else {
					return sourcemaps.write('./', {
						sourceMappingURL: () => `${dest}.map`
					});
				}
			}),
			rename(path => {
				if (path.extname !== '.map') {
					path.extname = '';
				}
				path.basename = dest;
			}),
			gulpif(destFolder !== 'disabled', function () {
				return gulp.dest(destFolder);
			})
		);

		// Returns a combined stream so an error handler can be attached to the end of the pipeline,
		// and it will have effects in all the steps. We need to resume() because stream-combiner2
		// seems to pause the stream and it doesn't reach the `end` event
		return combinedStream.resume();
	}
};

module.exports.watchable = true;
module.exports.description = 'Build module in current directory';
