'use strict';

const commandLine = require('../helpers/command-line');

function getBowerCommand() {
	// TODO: Make this always return bower/bin/bower from within this project's node modules
	// It might already be doing this
	return require.resolve('bower/bin/bower');
}

module.exports = function runBowerInstall(outputStreams) {
	return commandLine.run(getBowerCommand(), [
		'install',
		'--config.registry.search=http://registry.origami.ft.com',
		'--config.registry.search=https://bower.herokuapp.com'
	], outputStreams);
};
