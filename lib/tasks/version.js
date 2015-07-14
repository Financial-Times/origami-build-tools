'use strict';
var path = require('path');

module.exports = function() {
	var requirePath = path.join(__dirname, '/../../package.json');
	console.log("v" + require(requirePath).version);
};
module.exports.description = 'Print the installed version of Origami Build Tools';
