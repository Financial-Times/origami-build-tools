/*global require, exports, process*/

var childProcess = require('child_process'),
    which = require('which'),
    log = require('./log'),
    windows = (process.platform.indexOf("win32") >= 0 || process.platform.indexOf("win64") >= 0);

function run(command, args, callback) {
    "use strict";
    if (windows) {
        args.unshift('/c', command);
        command = 'cmd';
    }
	var pro = childProcess.spawn(which.sync(command), args);
    pro.stdout.on('data', function(data) {
        log.secondary(data);
    });
    pro.stderr.on('data', function(data) {
        log.secondaryError(data);
    });
    pro.on('error', function(error) {
        log.secondaryError(error);
        callback();
    });
    pro.on('close', callback);
}

exports.run = run;