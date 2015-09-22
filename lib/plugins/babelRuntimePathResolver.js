// Makes paths to babel-runtime polyfills absolute as they're
// in OBT's node_modules directory and not the module's
'use strict';

var path = require('path');
var falafel = require('falafel');

var prefix = /babel-runtime/;
var rootDirectory = path.resolve(__dirname, '../../node_modules');

module.exports = function babelRuntimePathResolver(file) {
	this.cacheable = true;

	return String(falafel(file, { locations: true, ecmaVersion: 6 }, function(node) {
		// Find require() calls
		if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
			if (node.callee.name === 'require' && prefix.test(node.arguments[0].value)) { // require("babel-runtime/*")
				var requirePath = rootDirectory + '/' + node.arguments[0].value;
				node.update('require(' + JSON.stringify(requirePath) + ')');
			} else {// none of the above, skip
				return;
			}
		}
	}));
}
