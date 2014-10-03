/*global require, process, exports */

"use strict";

var fs = require('fs'),
    path = require('path'),
    find = require('findit'),
    buildFolderPath = process.cwd() + '/build/',
	npmconf = require('npmconf');

function getBuildFolderPath() {
    return buildFolderPath;
}

function sassExists() {
    var sassMainPath = process.cwd() + '/main.scss';
    return fs.existsSync(sassMainPath);
}

function jsExists() {
    var jsMainPath = process.cwd() + '/main.js',
        bowerJson = getBowerJson(),
        fileExists = fs.existsSync(jsMainPath),
        isInBowerMain = (bowerJson && bowerJson.main && bowerJson.main.indexOf('main.js') > -1);
    if (isInBowerMain && !fileExists) {
        log.primaryError("main.js is listed in bower.json main, but file doesn't exist.");
    } else if (!isInBowerMain && fileExists) {
        log.primaryError("main.js exists but is not listed in bower.json main.");
    }
    return (isInBowerMain && fileExists);
}

function requireIfExists(path) {
    if (fs.existsSync(path)) {
        return require(path);
    } else {
        return undefined;
    }
}

function getPackageJson() {
    return requireIfExists(process.cwd() + '/package.json');
}

function packageJsonExists() {
    return (typeof getPackageJson() !== "undefined");
}

function getBowerJson() {
    return requireIfExists(process.cwd() + '/bower.json');
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

function recursiveFileSearch(root, ext, callback) {
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
        callback(files);
    });
}

function getSASSFilesList(callback) {
    recursiveFileSearch(process.cwd(), ".scss", callback);
}

function sassSupportsSilent(callback) {
    var supportsSilent = false,
        moduleName = getModuleName();
    if (moduleName) {
        getSASSFilesList(function(files) {
            for (var c = 0, l = files.length; c < l; c++) {
                var fileContents = fs.readFileSync(files[c], { encoding: "utf-8" });
                if (fileContents.indexOf(moduleName + "-is-silent") >= 0) {
                    supportsSilent = true;
                    break;
                }
            }
            callback(supportsSilent);
        });
    } else {
        callback(false);
    }
}

/**
 * Get an array of the paths listed in the project's .gitignore file as
 * absolute paths.
 *
 * @returns {array}
 */
function getGitIgnorePaths() {
    var gitIgnoreFilePath = path.join(process.cwd(), '/.gitignore');

    // If it can't find a .gitignore, return an empty array instead of failing
    if (fs.existsSync(gitIgnoreFilePath)) {
        var ignoreFiles = fs.readFileSync(gitIgnoreFilePath, { encoding: 'utf-8' });

        // Split the file list, and then add then make absolute by mapping
        // (path) -> (dir)/(path)
        return ignoreFiles.split('\n').filter(function(path) { return path !== '';  }).map(function(pathName) {
            return path.join(process.cwd(), pathName);
        });
    } else {
        return [];
    }
    
}

/** Get the node_modules directory that will be used when `npm install` is run
 *  in the current working directory (process.cwd()). This is necessary as npm walks up the
 *  directory tree until it finds a node_modules directory when npm installing.
 */
function getNodeModulesDirectoryInUse(callback) {

	npmconf.load({}, function(err, conf) {
		if (err) {
			callback(err);
			return;
		}

		conf.findPrefix(process.cwd(), function(err, pathPrefix) {
			var nodeModulesPath = pathPrefix;

			if (pathPrefix) {
				nodeModulesPath = path.join(pathPrefix, "node_modules");
			}

			callback(err, nodeModulesPath);
		});
	});
}

exports.getBuildFolderPath = getBuildFolderPath;
exports.sassExists = sassExists;
exports.jsExists = jsExists;
exports.getPackageJson = getPackageJson;
exports.packageJsonExists = packageJsonExists;
exports.getBowerJson = getBowerJson;
exports.bowerJsonExists = bowerJsonExists;
exports.getModuleName = getModuleName;
exports.recursiveFileSearch = recursiveFileSearch;
exports.sassSupportsSilent = sassSupportsSilent;
exports.getGitIgnorePaths = getGitIgnorePaths;
exports.getNodeModulesDirectoryInUse = getNodeModulesDirectoryInUse;
