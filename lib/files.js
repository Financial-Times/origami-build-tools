/*global require, process */

var fs = require('fs');

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

exports.sassExists = sassExists;
exports.getPackageJson = getPackageJson;
exports.packageJsonExists = packageJsonExists;
exports.getBowerJson = getBowerJson;
exports.bowerJsonExists = bowerJsonExists;