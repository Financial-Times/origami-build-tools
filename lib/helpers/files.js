'use strict';

const fs = require('fs');
const path = require('path');
const find = require('findit');
const npmconf = require('npmconf');
const log = require('./log');

function getBuildFolderPath() {
	return path.join(process.cwd(), '/build/');
}

function requireIfExists(filePath) {
	if (fs.existsSync(filePath)) {
		return require(filePath);
	} else {
		return undefined;
	}
}

function getPackageJson() {
	return requireIfExists(path.join(process.cwd(), '/package.json'));
}

function packageJsonExists() {
	return (typeof getPackageJson() !== 'undefined');
}

function getBowerJson() {
	return requireIfExists(path.join(process.cwd(), '/bower.json'));
}

function bowerJsonExists() {
	return (typeof getBowerJson() !== 'undefined');
}

function getMainSassPath() {
	const sassMainPath = path.join(process.cwd(), '/main.scss');
	const bowerJson = getBowerJson();
	const fileExists = fs.existsSync(sassMainPath);
	let isInBowerMain = false;
	if (bowerJson) {
		if (bowerJson.main instanceof Array && bowerJson.main.indexOf('main.scss') > -1) {
			isInBowerMain = true;
		} else if (typeof bowerJson.main === 'string' && bowerJson.main === 'main.scss') {
			isInBowerMain = true;
		}
	}
	if (isInBowerMain && !fileExists) {
		log.primaryError('main.scss is listed in bower.json main, but file doesn\'t exist.');
	} else if (!isInBowerMain && fileExists) {
		log.primaryError('main.scss exists but is not listed in bower.json main.');
	}
	if (isInBowerMain && fileExists) {
		return sassMainPath;
	} else {
		return null;
	}
}

function getMainJsPath() {
	const jsMainPath = path.join(process.cwd(), '/main.js');
	const bowerJson = getBowerJson();
	const fileExists = fs.existsSync(jsMainPath);
	let isInBowerMain = false;
	if (bowerJson) {
		if (bowerJson.main instanceof Array && bowerJson.main.indexOf('main.js') > -1) {
			isInBowerMain = true;
		} else if (typeof bowerJson.main === 'string' && bowerJson.main === 'main.js') {
			isInBowerMain = true;
		}
	}
	if (isInBowerMain && !fileExists) {
		log.primaryError('main.js is listed in bower.json main, but file doesn\'t exist.');
	} else if (!isInBowerMain && fileExists) {
		log.primaryError('main.js exists but is not listed in bower.json main.');
	}
	if (isInBowerMain && fileExists) {
		return jsMainPath;
	} else {
		return null;
	}
}

function getModuleName() {
	const bowerJson = getBowerJson();
	if (bowerJson) {
		return bowerJson.name;
	}
	return '';
}

function recursiveFileSearch(root, ext) {
	return new Promise(function(resolve) {
		const excluded = ['.git', '.idea', 'bower_components', 'node_modules'];
		const finder = find(root);
		const files = [];
		finder.on('directory', function(dir, stat, stop) {
			const base = path.basename(dir);
			if (excluded.indexOf(base) > -1) {
				stop();
			}
		});
		finder.on('file', function(file) {
			if (path.extname(file) === ext) {
				files.push(file);
			}
		});
		finder.on('end', function() {
			resolve(files);
		});
	});
}

function getSassFilesList() {
	return recursiveFileSearch(process.cwd(), '.scss');
}

function sassSupportsSilent(files) {
	return new Promise(function(resolve, reject) {
		let supportsSilent = false;
		const moduleName = getModuleName();
		if (moduleName) {
			for (let c = 0; c < files.length; c++) {
				const fileContents = fs.readFileSync(files[c], { encoding: 'utf-8' });
				if (fileContents.indexOf(moduleName + '-is-silent') >= 0) {
					supportsSilent = true;
					break;
				}
			}
			resolve(supportsSilent);
		} else {
			reject('Silent mode support can\'t be verified if your module name is not set in your bower.json file.');
		}
	});
}

// Get the node_modules directory that will be used when `npm install` is run
// in the current working directory (process.cwd()). This is necessary as npm walks up the
// directory tree until it finds a node_modules directory when npm installing.
function getNodeModulesDirectoryInUse() {
	return new Promise(function(resolve, reject) {
		npmconf.load({}, function(err, conf) {
			if (err) {
				reject(err);
			}
			conf.findPrefix(process.cwd(), function(e, pathPrefix) {
				if (e) {
					reject(e);
				}
				let nodeModulesPath = pathPrefix;

				if (pathPrefix) {
					nodeModulesPath = path.join(pathPrefix, 'node_modules');
				}

				resolve(nodeModulesPath);
			});
		});
	});
}

exports.getBuildFolderPath = getBuildFolderPath;
exports.getMainSassPath = getMainSassPath;
exports.getMainJsPath = getMainJsPath;
exports.getPackageJson = getPackageJson;
exports.packageJsonExists = packageJsonExists;
exports.getBowerJson = getBowerJson;
exports.bowerJsonExists = bowerJsonExists;
exports.getModuleName = getModuleName;
exports.getSassFilesList = getSassFilesList;
exports.sassSupportsSilent = sassSupportsSilent;
exports.getNodeModulesDirectoryInUse = getNodeModulesDirectoryInUse;
