/*global require, exports, process*/

var childProcess = require('child_process'),
    which = require('which'),
    log = require('./log'),
    windows = (process.platform.indexOf("win32") >= 0 || process.platform.indexOf("win64") >= 0);

function run(command, args, callback) {
    "use strict";
    var pro,
        stdOut = "",
        stdErr = "";
    if (windows) {
        args.unshift('/c', command);
        command = 'cmd';
    }
    try {
        command = which.sync(command);
    } catch (e) {
        callback(e, stdOut);
        return;
    }
	pro = childProcess.spawn(command, args, { stdio: 'inherit' });
    pro.on('error', function(error) {
        log.secondaryError(error);
    });
    pro.on('close', function() {
        callback(stdErr, stdOut);
    });
}

exports.run = run;