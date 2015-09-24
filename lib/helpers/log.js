'use strict';

require('colors');

const noOp = () => {};

const logLevelNormal = process.env.OBT_LOG_LEVEL !== 'none';
const logLevelDebug = process.env.OBT_LOG_LEVEL === 'debug';

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
	primary: (logLevelNormal) ? primary : noOp,
	primaryError: (logLevelNormal) ? primaryError : noOp,
	secondary: (logLevelNormal) ? secondary : noOp,
	secondaryError: (logLevelNormal) ? secondaryError : noOp,
	debug: (logLevelDebug) ? debug : noOp
};
