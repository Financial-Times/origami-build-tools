/*global require, exports, process*/

var childProcess = require('child_process'),
    which = require('which'),
    log = require('./log'),
    windows = (process.platform.indexOf("win32") >= 0 || process.platform.indexOf("win64") >= 0);

function run(command, args, options, stdin, callback) {
    "use strict";
    var pro,
        stdOut = [],
        stdErr = [];

	// Options and stdin argument are optional, if options is a function, assume options
	// argument is the callback
	if (typeof options === 'function') {
		callback = options;
		options = {};
    // If options is a string, assume options is stdin and stdin is the callback
	} else if (typeof options === 'string') {
        callback = stdin;
        stdin = options;
        options = {};
    // If stdin is a function, assume stdin is the callback
    } else if (typeof stdin === 'function') {
        callback = stdin;
        // We don't really have an stdin, so we set it to null so the if at the end fails
        stdin = null;
    }

    options = options || {}
    options.stdio = [3] || 'inherit';
    if (options.stdio !== 'inherit') {
        // stdin
        options.stdio[0] = options.stdin  || process.stdin;
        // stdout
        options.stdio[1] = options.stdout || process.stdout;
        // stderr
        options.stdio[2] = options.stderr || process.stderr;
    }
    console.log(options);

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

    console.log(args);
    pro = childProcess.spawn(command, args, options);

    pro.on('error', function(error) {
        log.secondaryError(error);
    });

    pro.on('close', function(code, signal) {
        callback(code ? code : null, { "stderr": Buffer.concat(stdErr), "stdout": Buffer.concat(stdOut) });
    });

    if (pro.stderr) {
        pro.stderr.on('data', function(data) {
            stdErr.push(data);
        });
    }

    if (pro.stdout) {
        pro.stdout.on('data', function(data) {
            log.secondary(data.toString());
            stdOut.push(data);
        });
    }

    if (stdin) {
        pro.stdin.end(stdin);
    }
}

exports.run = run;
