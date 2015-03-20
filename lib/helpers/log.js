'use strict';

require('colors');

var debugLog = function() {};

if (process.env.DEBUG === "true") {
	debugLog = function(text) {
		console.log(String(text).grey);
	};
}

module.exports = {

	primary: function(text) {
		console.log(String(text).bold);
	},

	primaryError: function(text) {
		console.log(String(text).bold.red);
	},

	secondary: function(text) {
		console.log(String(text).grey);
	},

	debug: debugLog,

	secondaryError: function(text) {
		console.log(String(text).red);
	}

};
