'use strict';

module.exports = function() {
	console.log("v"+require(__dirname + '/../../package.json').version);
};
module.exports.description = 'Print the installed version of Origami Build Tools';
