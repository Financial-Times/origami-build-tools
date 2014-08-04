/*global require, exports, process */

var fs = require('fs'),
    path = require('path'),
    commandLine = require('./command-line'),
    defaultSassArgs = [
        '--load-path',
        './bower_components/',
        '--load-path',
        'demos/src'
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

function compile(sassFile, dest, options, callback) {
    "use strict";
    var args = defaultSassArgs.slice(0);
    if (options.style) {
        args.push('--style', options.style);
    }
    if (options.sourcemap) {
        args.push('--sourcemap');
    }

    commandLine.run('sass', args.concat(['--stdin','--scss', dest]), { stdin: 'pipe' }, sassFile, callback);
}

function compileWithVars(sassFile, dest, vars, options, callback) {
    "use strict";
    var sassVarsStr = getSassVariablesString(vars);
    compile(sassVarsStr + '\n' + sassFile, dest, options, function() {
        callback();
    });
}

exports.compile = compile;
exports.compileWithVars = compileWithVars;
