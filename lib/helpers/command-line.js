'use strict';

const execa = require('execa');
const process = require('process');

function run(command, args, {
	stdout = process.stdout,
	stderr = process.stderr
} = {}) {
	const result = execa(command, args);
	if (stdout) {
		result.stdout.pipe(stdout);
	}
	if (stderr) {
		result.stderr.pipe(stderr);
	}

	return result;
}

exports.run = run;
