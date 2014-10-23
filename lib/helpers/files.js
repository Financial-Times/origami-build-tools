'use strict';

var fs = require('fs'),
	path = require('path'),
	find = require('findit'),
	npmconf = require('npmconf'),
	log = require('./log');

function getBuildFolderPath() {
	return path.join(process.cwd(), '/build/');
}

function getMainSassPath() {
	var sassMainPath = path.join(process.cwd(), '/main.scss'),
		bowerJson = getBowerJson(),
		fileExists = fs.existsSync(sassMainPath),
		isInBowerMain = false;
	if (bowerJson) {
		if (bowerJson.main instanceof Array && bowerJson.main.indexOf('main.scss') > -1) {
			isInBowerMain = true;
		} else if (typeof bowerJson.main === 'string' && bowerJson.main === 'main.scss') {
			isInBowerMain = true;
		}
	}
	if (isInBowerMain && !fileExists) {
		log.primaryError("main.scss is listed in bower.json main, but file doesn't exist.");
	} else if (!isInBowerMain && fileExists) {
		log.primaryError("main.scss exists but is not listed in bower.json main.");
	}
	if (isInBowerMain && fileExists) {
		return sassMainPath;
	} else {
		return null;
	}
}

function getMainJsPath() {
	var jsMainPath = path.join(process.cwd(), '/main.js'),
		bowerJson = getBowerJson(),
		fileExists = fs.existsSync(jsMainPath),
		isInBowerMain = false;
	if (bowerJson) {
		if (bowerJson.main instanceof Array && bowerJson.main.indexOf('main.js') > -1) {
			isInBowerMain = true;
		} else if (typeof bowerJson.main === 'string' && bowerJson.main === 'main.js') {
			isInBowerMain = true;
		}
	}
	if (isInBowerMain && !fileExists) {
		log.primaryError("main.js is listed in bower.json main, but file doesn't exist.");
	} else if (!isInBowerMain && fileExists) {
		log.primaryError("main.js exists but is not listed in bower.json main.");
	}
	if (isInBowerMain && fileExists) {
		return jsMainPath;
	} else {
		return null;
	}
}

function requireIfExists(path) {
	if (fs.existsSync(path)) {
		return require(path);
	} else {
		return undefined;
	}
}

function getPackageJson() {
	return requireIfExists(path.join(process.cwd(), '/package.json'));
}

function packageJsonExists() {
	return (typeof getPackageJson() !== "undefined");
}

function getBowerJson() {
	return requireIfExists(path.join(process.cwd(), '/bower.json'));
}

function bowerJsonExists() {
	return (typeof getBowerJson() !== "undefined");
}

function getModuleName() {
	var bowerJson = getBowerJson();
	if (bowerJson) {
		return bowerJson.name;
	}
	return "";
}

function recursiveFileSearch(root, ext) {
	return new Promise(function(resolve) {
		var excluded = ['.git', '.idea', 'bower_components', 'node_modules'],
			finder = find(root),
			files = [];
		finder.on('directory', function(dir, stat, stop) {
			var base = path.basename(dir);
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

function getSASSFilesList() {
	return recursiveFileSearch(process.cwd(), ".scss");
}

function sassSupportsSilent(files) {
	return new Promise(function(resolve, reject) {
		var supportsSilent = false,
			moduleName = getModuleName();
		if (moduleName) {
			for (var c = 0; c < files.length; c++) {
				var fileContents = fs.readFileSync(files[c], { encoding: "utf-8" });
				if (fileContents.indexOf(moduleName + "-is-silent") >= 0) {
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

/** Get the node_modules directory that will be used when `npm install` is run
 *  in the current working directory (process.cwd()). This is necessary as npm walks up the
 *  directory tree until it finds a node_modules directory when npm installing.
 */
function getNodeModulesDirectoryInUse() {
	return new Promise(function(resolve, reject) {
		npmconf.load({}, function(err, conf) {
			if (err) {
				reject(err);
			}
			conf.findPrefix(process.cwd(), function(err, pathPrefix) {
				if (err) {
					reject(err);
				}
				var nodeModulesPath = pathPrefix;

				if (pathPrefix) {
					nodeModulesPath = path.join(pathPrefix, "node_modules");
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
exports.getSASSFilesList = getSASSFilesList;
exports.sassSupportsSilent = sassSupportsSilent;
exports.getNodeModulesDirectoryInUse = getNodeModulesDirectoryInUse;
