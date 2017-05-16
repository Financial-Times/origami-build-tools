'use strict';

const Listr = require('listr');
const verifyOrigamiJsonFile = require('./verify-origami-json');
const verifyJavaScript = require('./verify-javascript');
const verifySass = require('./verify-sass');

module.exports = function () {
	return new Listr(
		[
			verifyOrigamiJsonFile,
			verifyJavaScript,
			verifySass
		]
	)
	.run();
};

module.exports.watchable = false;
