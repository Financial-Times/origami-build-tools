'use strict';

var childProcess = require('child_process');
var which = require('which');
var log = require('./log');
var windows = (process.platform.indexOf("win32") >= 0 || process.platform.indexOf("win64") >= 0);

function run(command, args, options) {
	return new Promise(function(resolve, reject) {
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
			reject({ stdout: stdOut, stderr: stdErr, err: e });
		}

		var fullCommand = command + ' ' + args.join(' ');
		pro = childProcess.exec(fullCommand, options);

		pro.on('error', function(error) {
			log.secondaryError(error);
		});

		pro.on('close', function(code) {
			var output = { "stderr": stdErr, "stdout": stdOut };

			if (code !== 0) {
				output.err = code;
				reject(output);
			}
			resolve(output);
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
	});
}

exports.run = run;
