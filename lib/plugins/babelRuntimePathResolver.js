'use strict';

var path = require('path');
var through = require('through2');
var falafel = require('falafel');
var fs = require('fs');

var prefix = /babel-runtime/;

function create(config) {
	return function(file) {
		if (!(/\.js$/).test(file)) return through();

		var rootDirectory = path.resolve(path.normalize(config.rootDirectory || './node_modules'));

		var tr = through(function(chunk, enc, callback) {
			try {
				this.push(parse(chunk));
			} catch(err) {
				err.debowerifyFile = file;
				err.sourcecode = chunk;
				this.emit('error', err);
			}

			return callback();
		});

		return tr;

		function parse(source) {
			return String(falafel(source, { locations: true, ecmaVersion: 6 }, function(node) {
				// Find require() calls
				if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
					var requirePath;

					if (node.callee.name === 'require' && prefix.test(node.arguments[0].value)) { // require("babel-runtime/*")
						requirePath = rootDirectory + '/' + node.arguments[0].value;
					} else {// none of the above, skip
						return;
					}

					node.update('require('+JSON.stringify(requirePath)+');');
				}
			}));
		}
	};
}

module.exports = create({});
module.exports.create = create;
