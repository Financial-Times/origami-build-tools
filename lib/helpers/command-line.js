'use strict';

const execa = require('execa');
const process = require('process');

function run(command, args, streams) {
	const result = execa(command, args);
	const stdout = streams && streams.stdout !== undefined ? streams.stdout : process.stdout;
	const stderr = streams && streams.stderr !== undefined ? streams.stderr : process.stderr;
	if (stdout) {
		result.stdout.pipe(stdout);
	}
	if (stderr) {
		result.stderr.pipe(stderr);
	}
	return result;
}

module.exports.run = run;
