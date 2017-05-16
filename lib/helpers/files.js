'use strict';

const fs = require('fs');
const path = require('path');
const find = require('findit');
const npmconf = require('npmconf');
const log = require('./log');

function getBuildFolderPath(cwd) {
	cwd = cwd || process.cwd();
	return path.join(cwd, '/build/');
}

function requireIfExists(filePath) {
	if (fs.existsSync(filePath)) {
		return require(filePath);
	} else {
		return undefined;
	}
}

function getPackageJson(cwd) {
	cwd = cwd || process.cwd();
	return requireIfExists(path.join(cwd, '/package.json'));
}

function packageJsonExists() {
	return typeof getPackageJson() !== 'undefined';
}

function getBowerJson(cwd) {
	cwd = cwd || process.cwd();
	return requireIfExists(path.join(cwd, '/bower.json'));
}

function bowerJsonExists() {
	return typeof getBowerJson() !== 'undefined';
}

function getMainSassPath(cwd) {
	cwd = cwd || process.cwd();
	const sassMainPath = path.join(cwd, '/main.scss');
	const bowerJson = getBowerJson(cwd);
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
		// This should probably throw an error
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

function getMainJsPath(cwd) {
	cwd = cwd || process.cwd();
	const jsMainPath = path.join(cwd, '/main.js');
	const bowerJson = getBowerJson(cwd);
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

function getModuleName(cwd) {
	const bowerJson = getBowerJson(cwd);
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

// List mustache files in a directory, recursing over subdirectories
function getMustacheFilesList(basePath) {
	let mustacheFiles = [];

	fs.readdirSync(basePath, {encoding: 'utf8'}).forEach(filePath => {
		filePath = path.join(basePath, filePath);
		const stat = fs.statSync(filePath);

		// If the current path points to a directory, recurse
		// over it
		if (stat.isDirectory()) {
			mustacheFiles = mustacheFiles.concat(getMustacheFilesList(filePath));

		// If the current path points to a mustache file, add
		// it to the output list
		} else if (path.extname(filePath) === '.mustache') {
			mustacheFiles.push(filePath);
		}
	});

	return mustacheFiles.sort();
}

function getSassFilesList(cwd) {
	cwd = cwd || process.cwd();
	return recursiveFileSearch(cwd, '.scss');
}

function sassSupportsSilent(files, cwd) {
	return new Promise(function(resolve, reject) {
		let supportsSilent = false;
		const moduleName = getModuleName(cwd);
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
			reject(new Error('Silent mode support can\'t be verified if your module name is not set in your bower.json file.'));
		}
	});
}

// Get the node_modules directory that will be used when `npm install` is run
// in the current working directory (process.cwd()). This is necessary as npm walks up the
// directory tree until it finds a node_modules directory when npm installing.
function getNodeModulesDirectoryInUse(cwd) {
	cwd = cwd || process.cwd();
	return new Promise(function(resolve, reject) {
		npmconf.load({}, function(err, conf) {
			if (err) {
				reject(err);
			}
			conf.findPrefix(cwd, function(e, pathPrefix) {
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
exports.getMustacheFilesList = getMustacheFilesList;
