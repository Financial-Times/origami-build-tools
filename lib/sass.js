/*global require, exports, process */

var fs = require('fs'),
    path = require('path'),
    commandLine = require('./command-line'),
    defaultSassArgs = [
        '--load-path',
        './bower_components/',
        '--style',
        'compressed'
    ];

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

function compile(src, dest, callback) {
    "use strict";
    commandLine.run('sass', defaultSassArgs.concat(['--scss', src, dest]), callback);
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

exports.compile = compile;
exports.compileWithVars = compileWithVars;