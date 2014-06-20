/*globals require, exports, console */

var log = require('./log');

function getLengthOfLongestCommand(commands) {
	"use strict";

	var stringLengthComparison = function(a, b) {
		return a.length > b.length ? a : b;
	}

	var longestKey = Object.keys(commands).reduceRight(stringLengthComparison);
	return longestKey.length
}

function printCommandInfoAligned(commands) {
	"use strict";
	var longestCommandLength = getLengthOfLongestCommand(commands);

	Object.keys(commands).forEach(function(command) {
		var alignment = new Array(longestCommandLength - command.length + 1).join(' ');
		console.log(
				command,
				alignment + ' - ',
				commands[command].description,
				commands[command].watchable ? 'Optional: --watch' : '');
	})
}

exports.printUsage = function (commands) {
	log.primary('Available commands:');
	printCommandInfoAligned(commands);
};
