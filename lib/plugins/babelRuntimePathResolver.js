// Makes paths to babel-runtime polyfills absolute as they might be in OBT's
// node_modules directory and not the module's, depending on node version
'use strict';

const falafel = require('falafel');

const prefix = /babel-runtime/;

module.exports = function babelRuntimePathResolver(file) {
	this.cacheable = true;

	return String(falafel(file, { locations: true, ecmaVersion: 6 }, function(node) {
		// Find require() calls
		if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
			if (node.callee.name === 'require' && prefix.test(node.arguments[0].value)) { // require("babel-runtime/*")
				const requirePath = require.resolve(node.arguments[0].value);
				node.update('require(' + JSON.stringify(requirePath) + ')');
			} else {// none of the above, skip
				return;
			}
		}
	}));
};
