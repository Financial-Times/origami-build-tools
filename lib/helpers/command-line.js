'use strict';

const execa = require('execa');

function run(command, args) {
	const result = execa(command, args);

	result.stdout.pipe(process.stdout);
	result.stderr.pipe(process.stderr);

	return result;
}

exports.run = run;
