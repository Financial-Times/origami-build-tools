'use strict';

const path = require('path');

module.exports = function() {
	console.log('v' + require(path.join(__dirname, '/../../package.json')).version);
};
module.exports.description = 'Print the installed version of Origami Build Tools';
