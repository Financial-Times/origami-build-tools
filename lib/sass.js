/*global require, exports, process */

var fs = require('fs'),
    path = require('path'),
    commandLine = require('./command-line'),
    defaultSassArgs = [
        '--load-path',
        './bower_components/'
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

function compile(src, dest, options, callback) {
    "use strict";
    var args = defaultSassArgs.slice(0);
    if (options.style) {
        args.push('--style', options.style);
    }
    if (options.sourcemap) {
        args.push('--sourcemap');
    }

    commandLine.run('sass', args.concat(['--scss', src, dest]), callback, { stdio: 'inherit' });
}

function compileWithVars(src, dest, vars, options, callback) {
    "use strict";
    var sassVarsStr = getSassVariablesString(vars),
        srcFileStr = fs.readFileSync(src, { encoding: "utf-8" }),
        tempSrcPath = path.dirname(src) + '/tmp-src.scss';
    fs.writeFileSync(tempSrcPath, sassVarsStr + '\n' + srcFileStr, { encoding: "utf-8" });
    compile(tempSrcPath, dest, options, function() {
        fs.unlinkSync(tempSrcPath);
        callback();
    });
}

exports.compile = compile;
exports.compileWithVars = compileWithVars;
