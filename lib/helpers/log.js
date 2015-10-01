'use strict';

require('colors');

const noOp = () => {};

const minLogLevel = process.env.OBT_LOG_LEVEL !== 'none';
const debugLogLevel = process.env.OBT_LOG_LEVEL === 'debug';

const primary = (text) => {
	console.log(String(text).bold);
};

const primaryError = (text) => {
	console.log(String(text).bold.red);
};

const secondary = (text) => {
	console.log(String(text).grey);
};

const secondaryError = (text) => {
	console.log(String(text).red);
};

const debug = (text) => {
	console.log(String(text).grey);
};

module.exports = {
	primary: (minLogLevel) ? primary : noOp,
	primaryError: (minLogLevel) ? primaryError : noOp,
	secondary: (minLogLevel) ? secondary : noOp,
	secondaryError: (minLogLevel) ? secondaryError : noOp,
	debug: (debugLogLevel) ? debug : noOp
};
