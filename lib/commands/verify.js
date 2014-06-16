/*global require, process, __dirname, exports*/

"use strict";

var path = require('path'),
	async = require('async'),
    childProcess = require("child_process"),
    log = require('../log.js'),
	verifyExists = require('../verify');

function createScssLinterTask(callback) {

    var configPath = __dirname + '/../../config/scss-lint.yml',
        excludePaths = [
            path.join(process.cwd(), '/bower_components/**'),
            path.join(process.cwd(), '/demos/**'),
            path.join(process.cwd(), '/node_modules/**')
        ],
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
