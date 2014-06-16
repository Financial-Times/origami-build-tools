/*global require, process, __dirname, exports*/

"use strict";

var path = require('path'),
	async = require('async'),
	fs = require('fs'),
    childProcess = require("child_process"),
	files = require('../files'),
    log = require('../log.js'),
	verifyExists = require('../verify');


/**
 * Adds a wildcard glob onto the end of a pathname if it is a directory.
 *
 * scss-lint's exclusions are inconsistent with gitignore which is the same
 * format jshint uses this works around the inconsistency so the same
 * exclusions list can be used.
 *
 * @returns {string}
 */
function addWildCardIfDirectory(pathname) {

	var isExistingDirectory =
		fs.existsSync(pathname) &&
		fs.statSync(pathname).isDirectory();

	if (isExistingDirectory) {
		return path.join(pathname, '/*');
	}

	return pathname;
}

function createScssLinterTask(callback) {

    var configPath = __dirname + '/../../config/scss-lint.yml',
        excludePaths = files.getGitIgnorePaths().map(addWildCardIfDirectory),
        sourcePaths = [
            path.join(process.cwd(), '/*.scss'),
            path.join(process.cwd(), '/**/**/*.scss')
        ],
        command;

	if (!verifyExists.mainSass()) {
		return;
	}

    command = 'scss-lint --config ' + configPath + ' --exclude=' + excludePaths.join(',') + ' ' + sourcePaths.join(' ');

    console.log(command);

	return function() {
		childProcess.exec(command, function(err, stdout) {
			log.primaryError(stdout);
		});
	};
}

function createJavascriptLinterTask(callback) {

	var configPath = __dirname + '/../../config/jshint.json',
        excludePath = path.join(process.cwd(), '/.gitignore'),
		command = 'jshint --config ' + configPath + ' --exclude-path=' + excludePath + ' ./';

	if(!verifyExists.mainJs()) {
		return;
	}

	return function() {
		childProcess.exec(command, function(err, stdout) {
			log.primaryError(stdout);
		});
	};
}

function verify(callback) {
	async.parallel({
		'scss-lint': createScssLinterTask(callback),
		'jshint': createJavascriptLinterTask(callback)
	}, callback);
}

exports.run = verify;
