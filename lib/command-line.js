'use strict';

var childProcess = require('child_process'),
    which = require('which'),
    log = require('./log'),
    windows = (process.platform.indexOf("win32") >= 0 || process.platform.indexOf("win64") >= 0);

function run(command, args, options, callback) {
    var pro,
        stdOut = "",
        stdErr = "";

    // Options argument is optional, if callback is undefined, assume options
    // argument is the callback
    if (!callback) {
        callback = options;
        options = {};
    }

    if (windows) {
        args.unshift('/c', command);
        command = 'cmd';
    }

    try {
        command = which.sync(command);
    } catch (e) {
        callback(e, { stdout: stdOut, stderr: stdErr });
        return;
    }

    var fullCommand = command + ' ' + args.join(' ');
    pro = childProcess.exec(fullCommand, options);

    pro.on('error', function(error) {
        log.secondaryError(error);
    });

    pro.on('close', function(code) {
		var callbackWithValue = { "stderr": stdErr, "stdout": stdOut };

		if (code !== 0) {
			callbackWithValue.err = code;
			callback(callbackWithValue);
			return;
		}

		callback(null, callbackWithValue);
    });

    if (pro.stderr) {
        pro.stderr.on('data', function(data) {
            stdErr += data;
        });
    }

    if (pro.stdout) {
        pro.stdout.on('data', function(data) {
            stdOut += data;
        });
    }
}

exports.run = run;
