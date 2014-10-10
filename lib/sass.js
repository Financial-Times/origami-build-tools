'use strict';

var spawn = require('child_process').spawn,
    log = require('./log'),
    defaultSassArgs = [
        '--load-path',
        './bower_components/'
    ],
    windows = (process.platform.indexOf("win32") >= 0 || process.platform.indexOf("win64") >= 0);

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

function runSassCommand(command, args, sassFile, callback) {
    var sassProc,
        stdOut = [],
        stdErr = [];

    if (windows) {
        args.unshift('/c', command);
        command = 'cmd';
    }

    sassProc = spawn(command, args);
    sassProc.on('error', function(error) {
        log.secondaryError(error);
    });

    sassProc.on('close', function(code) {
        var callbackWithValue = { "stderr": Buffer.concat(stdErr).toString(), "stdout": Buffer.concat(stdOut).toString() };

        if (code !== 0) {
            callbackWithValue.err = code;
            callback(callbackWithValue);
            return;
        }

        callback(null, callbackWithValue);
    });

    sassProc.stderr.on('data', function(data) {
        log.secondaryError(data.toString());
        stdErr.push(data);
    });

    sassProc.stdout.on('data', function(data) {
        log.secondary(data.toString());
        stdOut.push(data);
    });

    sassProc.stdin.end(sassFile);
}

function compile(sassFile, dest, options, callback) {
    var args = defaultSassArgs.slice(0);
    if (options.style) {
        args.push('--style', options.style);
    }
    if (options.sourcemap) {
        args.push('--sourcemap');
    }
    // In future versions of SASS, it requires load paths to be set. It's also needed for the demos
    if (options.loadPaths) {
        options.loadPaths.forEach(function(path) {
            args.push('--load-path', path);
        });
    }

    runSassCommand('sass', args.concat(['--stdin','--scss', dest]), sassFile, callback);
}

function compileWithVars(sassFile, dest, vars, options, callback) {
    var sassVarsStr = getSassVariablesString(vars);
    compile(sassVarsStr + '\n' + sassFile, dest, options, function() {
        callback();
    });
}

exports.compile = compile;
exports.compileWithVars = compileWithVars;
