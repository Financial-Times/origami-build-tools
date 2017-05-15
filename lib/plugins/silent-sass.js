'use strict';

const through = require('through2');

function testSass(config, stream, css) {
	if (!(config.silent && css.length === 0 || !config.silent && css.length > 0)) {
		stream.emit('error', new Error('sass compilation for silent mode: ' + config.silent + ' failed.'));
	}
}

module.exports = function silentSass(config) {
	// creating a stream through which each file will pass
	const stream = through.obj(function(file, enc, cb) {
		testSass(config, this, file.toString());
		this.push(file);
		cb();
	});

	// Make the stream resume emitting data events so that it reaches the end event
	stream.resume();
	// returning the file stream
	return stream;
};
