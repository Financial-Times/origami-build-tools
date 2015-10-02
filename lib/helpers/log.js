'use strict';

require('colors');

const noOp = () => {};

const loggingEnabled = process.env.OBT_LOG_LEVEL !== 'none';
const debugLoggingEnabled = process.env.OBT_LOG_LEVEL === 'debug';

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
	primary: (loggingEnabled) ? primary : noOp,
	primaryError: (loggingEnabled) ? primaryError : noOp,
	secondary: (loggingEnabled) ? secondary : noOp,
	secondaryError: (loggingEnabled) ? secondaryError : noOp,
	debug: (debugLoggingEnabled) ? debug : noOp
};
