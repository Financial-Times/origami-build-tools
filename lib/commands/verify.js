/*global require, process, __dirname, exports*/

var path = require('path'),
    childProcess = require("child_process"),
    log = require('../log.js');

function verify(callback) {
    "use strict";

    var configPath = __dirname + '/../../config/scss-lint.yml',
        excludePaths = [
            path.join(process.cwd(), '/bower_components/*'),
            path.join(process.cwd(), '/demos/*'),
            path.join(process.cwd(), '/node_modules/*')
//            path.join(process.cwd(), '/bower_components/*')
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

exports.run = verify;