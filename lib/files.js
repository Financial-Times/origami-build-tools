/*global require, process, exports */

"use strict";

var fs = require('fs'),
    path = require('path'),
    find = require('findit'),
    tempFolderPath = process.cwd() + '/' + 'origami-build-tool-tmp';
function deleteFolderRecursive(path) {
    var files = [];
    if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file) {
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

function createTempFolder() {
    deleteTempFolder();
    fs.mkdirSync(tempFolderPath);
}

function deleteTempFolder() {
    deleteFolderRecursive(tempFolderPath);
}

function getTempFolderPath() {
    return tempFolderPath;
}

function sassExists() {
    var sassMainPath = process.cwd() + '/main.scss';
    return fs.existsSync(sassMainPath);
}

function jsExists() {
    var jsMainPath = process.cwd() + '/main.js';
    return fs.existsSync(jsMainPath);
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

exports.createTempFolder = createTempFolder;
exports.deleteTempFolder = deleteTempFolder;
exports.getTempFolderPath = getTempFolderPath;
exports.sassExists = sassExists;
exports.jsExists = jsExists;
exports.getPackageJson = getPackageJson;
exports.packageJsonExists = packageJsonExists;
exports.getBowerJson = getBowerJson;
exports.bowerJsonExists = bowerJsonExists;
exports.getModuleName = getModuleName;
exports.recursiveFileSearch = recursiveFileSearch;
exports.sassSupportsSilent = sassSupportsSilent;