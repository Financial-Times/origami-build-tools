'use strict';

const open = require('fs/promises').open;

/**
 * Node.JS no longer has an fs.exists method.
 * Instead we use the fs.open method in read (`r`) mode.
 * fs.open will throw an error if the file does not exist.
 * @param {string} file file-system path to the file you are wanting to check exists or not
 * @returns {Promise.<boolean>} Whether the file exists
*/
module.exports = function fileExists(file) {
	return open(file, 'r')
		.then(() => true)
		.catch(() => false);
};
