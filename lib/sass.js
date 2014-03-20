/*global require, exports, process */

var fs = require('fs'),
    path = require('path'),
    childProcess = require('child_process'),
    semver = require('semver'),
    log = require('./log.js'),
    defaultSassArgs = [
        '--load-path',
        './bower_components/',
        '--style',
        'compressed'
    ],
    requiredSassGemVersion = "3.3.3";

function getSassVariablesString(variables) {
    "use strict";
    var contents = "";
    for (var prop in variables) {
        if (variables.hasOwnProperty(prop)) {
            var value = variables[prop];
            contents += "$" + prop + ":" + value + ";\n";
        }
    }
    return contents;
}

function getInstalledSassGemVersion(callback) {
    "use strict";
    childProcess.exec("sass --v", function(error, stdout) {
        if (error) {
            callback(-1);
        } else {
            var re = new RegExp(/\d+(\.\d+)+/),
                version = stdout.trim().match(re);
            if (version) {
                callback(version[0]);
            } else {
                callback(-1);
            }
        }
    });
}

function gemInstallRequired(callback) {
    "use strict";
    getInstalledSassGemVersion(function(version) {
        if (version === -1 || semver.lt(version, requiredSassGemVersion)) {
            log.secondary("sass gem not installed, or old version.");
            callback(true);
        } else {
            log.secondary("sass gem " + version + " already installed.");
            callback(false);
        }
    });
}

function compile(src, dest, callback) {
    "use strict";
    var pro = childProcess.spawn('sass', defaultSassArgs.concat(['--scss', src, dest]));
    pro.stdout.on('data', function(data) {
        log.secondary(data);
    });
    pro.stderr.on('data', function(data) {
        log.secondaryError(data);
    });
    pro.on('close', callback);
}

function compileWithVars(src, dest, vars, callback) {
    "use strict";
    var sassVarsStr = getSassVariablesString(vars),
        srcFileStr = fs.readFileSync(src, { encoding: "utf-8" }),
        tempSrcPath = path.dirname(src) + '/tmp-src.scss';
    fs.writeFileSync(tempSrcPath, sassVarsStr + '\n' + srcFileStr, { encoding: "utf-8" });
    compile(tempSrcPath, dest, function() {
        fs.unlinkSync(tempSrcPath);
        callback();
    });
}

exports.requiredSassGemVersion = requiredSassGemVersion;
exports.gemInstallRequired = gemInstallRequired;
exports.compile = compile;
exports.compileWithVars = compileWithVars;