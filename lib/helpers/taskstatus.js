'use strict';

function taskStatus(taskResult, callback) {
	if (typeof taskResult !== 'undefined' && taskResult !== null) {
		// Check if the function returns a Promise
		if (taskResult instanceof Promise) {
			taskResult
				.then(function(result) {
					callback(null, result);
				})
				.catch(callback);
		// Check if it's a stream
		} else if (taskResult.on && taskResult.resume) {
			taskResult
				.on('error', callback)
				.on('end', function(result) {
					callback(null, result);
				});
			// Make sure it reaches 'end'
			taskResult.resume();
		}
	}
}

module.exports = taskStatus;
