'use strict';

const childProcess = require('child_process');
const which = require('which');
const log = require('./log');
const windows = (process.platform.indexOf('win32') >= 0 || process.platform.indexOf('win64') >= 0);

function run(command, args, options) {
	return new Promise(function(resolve, reject) {
		let stdOut = '';
		let stdErr = '';

		if (windows) {
			args.unshift('/c', command);
			command = 'cmd';
		}

		try {
			command = which.sync(command);
		} catch (e) {
			reject({ stdout: stdOut, stderr: stdErr, err: e });
		}

		const fullCommand = command + ' ' + args.join(' ');

		const pro = childProcess.exec(fullCommand, options);

		pro.on('error', function(error) {
			log.secondaryError(error);
		});

		pro.on('close', function(code) {
			const output = { 'stderr': stdErr, 'stdout': stdOut };

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
