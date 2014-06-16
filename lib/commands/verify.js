/*global require, process, __dirname, exports*/

"use strict";

var path = require('path'),
    childProcess = require("child_process"),
    log = require('../log.js');


function runScssLinter(callback) {
    var configPath = __dirname + '/../../config/scss-lint.yml',
        excludePaths = [
            path.join(process.cwd(), '/bower_components/*'),
            path.join(process.cwd(), '/demos/*'),
            path.join(process.cwd(), '/node_modules/*')
        ],
        sourcePaths = [
            path.join(process.cwd(), '/*.scss'),
            path.join(process.cwd(), '/**/**/*.scss')
        ],
        command;

    function getExcludeFlags() {
        var str = '';
        excludePaths.forEach(function(p) {
            str = str + ' --exclude=' + p;
        });
        return str;
    }

    command = 'scss-lint --config ' + configPath + getExcludeFlags() + ' ' + sourcePaths.join(' ');

    console.log(command);

    childProcess.exec(command, function(err, stdout) {
        log.primaryError(stdout);
        callback();
    });
}


function verify(callback) {
	runScssLinter(callback);
}

exports.run = verify;
