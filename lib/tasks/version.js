module.exports = function(gulp, config) {
	console.log("v"+require(__dirname + '/../../package.json').version);
};
module.exports.description = 'Prints the installed version of Origami Build Tools';
