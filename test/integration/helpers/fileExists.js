'use strict';

const denodeify = require('denodeify');
const open = denodeify(require('fs-extra').open);

/**
 * Node.JS no longer has an fs.exists method.
 * Instead we use the fs.open method in read (`r`) mode.
 * fs.open will throw an error if the file does not exist.
*/
module.exports = function fileExists(file) {
	return open(file, 'r')
		.then(() => true)
		.catch(() => false);
};
