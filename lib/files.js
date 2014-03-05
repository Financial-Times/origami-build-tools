/*global require, process */

"use strict";

var fs = require('fs'),
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

exports.createTempFolder = createTempFolder;
exports.deleteTempFolder = deleteTempFolder;
exports.getTempFolderPath = getTempFolderPath;
exports.sassExists = sassExists;
exports.getPackageJson = getPackageJson;
exports.packageJsonExists = packageJsonExists;
exports.getBowerJson = getBowerJson;
exports.bowerJsonExists = bowerJsonExists;