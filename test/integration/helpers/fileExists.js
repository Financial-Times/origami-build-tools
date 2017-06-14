'use strict';

const denodeify = require('denodeify');
const open = denodeify(require('fs-extra').open);

module.exports = function fileExists(file) {
	return open(file, 'r')
		.then(() => true)
		.catch(() => false);
};
