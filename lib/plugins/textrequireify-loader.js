// Not in use until the this.resourcePath issue is solved: https://github.com/webpack/webpack/issues/1410
'use strict';

var path = require('path');
var falafel = require('falafel');
var fs = require('fs');

var prefix = /^text!/;

module.exports = function textrequirefy(file) {
	this.cacheable = true;
	var webpack = this;
	var filePath = process.cwd();

	// Gets the cwd param
	var cwdParam = this.query.match(/(?:cwd=)(.*?)(?:&|$)/);
	var rootDirectory = path.resolve(path.normalize(cwdParam[1] || './bower_components/'));

	return String(falafel(file, { locations: true, ecmaVersion: 6 }, function(node) {
		// Find require() calls
		if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
			var requirePath;

			if(node.callee.name === 'requireText') { // requireText("file.txt")
				requirePath = node.arguments[0].value;
			} else if(node.callee.name === 'require' && prefix.test(node.arguments[0].value)) { // require("text!file.txt")
				requirePath = node.arguments[0].value.replace(prefix, '');
			} else {// none of the above, skip
				return;
			}

			var fsPath;
			if (/^\.+\//.test(requirePath)) {
				// this.resourcePath not working for some reason
				fsPath = path.resolve(path.dirname(this.resourcePath), requirePath); // relative paths are relative to the current file
			} else if (rootDirectory) {
				fsPath = path.resolve(rootDirectory, requirePath); // absolute paths require rootDirectory setting
			}

			if (fsPath.substring(0, rootDirectory.length) !== rootDirectory) {
				throw new Error('Can\'t require "' + requirePath + '" in "' + file + ':' + node.loc.start.line + '", because the path points outside the root directory (too many "../"?)');
			}

			if (!fs.existsSync(fsPath)) {
				// console.log(2001000000, fsPath);
				throw new Error('Can\'t require "' + requirePath + '" in "' + file + ':' + node.loc.start.line + '", because the file "' + fsPath + '" doesn\'t exist');
			}

			// JSON.stringify escapes the text as a JS string literal
			node.update(JSON.stringify(fs.readFileSync(fsPath, {encoding:'utf-8'})));
		}
	}));
}
