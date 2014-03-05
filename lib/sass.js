/*global require */

"use strict";

var fs = require('fs'),
    childProcess = require('child_process'),
    log = require('./log.js'),
    files = require('./files.js'),
    defaultSassArgs = [
        '--load-path',
        './bower_components/',
        '--style',
        'compressed'
    ];

function getSassVariablesString(variables) {
    var contents = "";
    for (var prop in variables) {
        if (variables.hasOwnProperty(prop)) {
            var value = variables[prop];
            contents += "$" + prop + ":" + value + ";\n";
        }
    }
    return contents;
}

function compile(src, dest, callback) {
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
    var sassVarsStr = getSassVariablesString(vars),
        srcFileStr = fs.readFileSync(src, { encoding: "utf-8" }),
        tempSrcPath = files.getTempFolderPath() + '/tmp-src.scss';
    fs.writeFileSync(tempSrcPath, sassVarsStr + '\n' + srcFileStr, { encoding: "utf-8" });
    compile(tempSrcPath, dest, function() {
        fs.unlinkSync(tempSrcPath);
        callback();
    });
}

exports.compile = compile;
exports.compileWithVars = compileWithVars;