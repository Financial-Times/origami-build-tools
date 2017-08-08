'use strict';

const execa = require('execa');
const process = require('process');

function run(command, args, options) {
	const result = execa(command, args, {
		cwd: options.cwd || process.cwd()
	});
	const stdout = options && options.stdout !== undefined ? options.stdout : process.stdout;
	const stderr = options && options.stderr !== undefined ? options.stderr : process.stderr;
	if (stdout) {
		result.stdout.pipe(stdout);
	}
	if (stderr) {
		result.stderr.pipe(stderr);
	}
	return result;
}

module.exports.run = run;
