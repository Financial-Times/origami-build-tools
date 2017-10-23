'use strict';

const path = require('path');
const falafel = require('falafel');
const fs = require('fs');
const getOptions = require('loader-utils').getOptions;
const prefix = /^text!/;

module.exports = function textrequirefy(file) {
	this.cacheable = true;
	const filePath = this.resourcePath;

	// Gets the cwd param
	const options = getOptions(this);
	const cwdParam = options.cwd;
	const rootDirectory = path.resolve(path.normalize(cwdParam || './bower_components/'));

	return String(falafel(file, { locations: true, ecmaVersion: 6 }, function(node) {
		// Find require() calls
		if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
			let requirePath;

			if(node.callee.name === 'requireText') { // requireText("file.txt")
				requirePath = node.arguments[0].value;
			} else if(node.callee.name === 'require' && prefix.test(node.arguments[0].value)) { // require("text!file.txt")
				requirePath = node.arguments[0].value.replace(prefix, '');
			} else {// none of the above, skip
				return;
			}

			let fsPath;
			if (/^\.+\//.test(requirePath)) {
				fsPath = path.resolve(path.dirname(filePath), requirePath); // relative paths are relative to the current file
			} else {
				fsPath = path.resolve(rootDirectory, requirePath); // absolute paths require rootDirectory setting
			}

			if (fsPath.substring(0, rootDirectory.length) !== rootDirectory) {
				throw new Error('Can\'t require "' + requirePath + '" in "' + file + ':' + node.loc.start.line + '", because the path points outside the root directory (too many "../"?)');
			}

			if (!fs.existsSync(fsPath)) {
				throw new Error('Can\'t require "' + requirePath + '" in "' + file + ':' + node.loc.start.line + '", because the file "' + fsPath + '" doesn\'t exist');
			}

			// JSON.stringify escapes the text as a JS string literal
			node.update(JSON.stringify(fs.readFileSync(fsPath, {encoding:'utf-8'})));
		}
	}));
};
