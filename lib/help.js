/*globals require, exports, console */

var log = require('./log');

function getLengthOfLongestCommand(commands) {
	"use strict";
	var longestLength = 0;
	for (var command in commands) {
		if (commands.hasOwnProperty(command)) {
			if (command.length > longestLength) {
				longestLength = command.length;
			}
		}
	}

	return longestLength;
}

function printCommandInfoAligned(commands) {
	"use strict";
	var longestCommandLength = getLengthOfLongestCommand(commands);

	for (var command in commands) {
		if (commands.hasOwnProperty(command)) {
			var alignment = '';
			for (var i = 0; i < (longestCommandLength - command.length); i++) {
				alignment += ' ';

			}

			console.log(
					command,
					alignment + ' - ',
					commands[command].description,
					commands[command].watchable ? 'Optional: --watch' : '');
		}
	}

}

exports.printUsage = function (commands) {
	log.primary('Available commands:');
	printCommandInfoAligned(commands);
};
