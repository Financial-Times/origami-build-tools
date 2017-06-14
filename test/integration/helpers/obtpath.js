'use strict';

const denodeify = require('denodeify');
const fs = require('fs-extra');
const path = require('path');

const readFile = denodeify(fs.readFile);

module.exports = function obtBin() {
	return readFile(path.join(__dirname, '../../../package.json'))
		.then(obtPackageJson => {
			const obtPackage = JSON.parse(obtPackageJson);
			return path.join(__dirname, '../../../', obtPackage.bin.obt);
		});
};
