/*global require, process, exports */

"use strict";

var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    extend = require('node.extend'),
    log = require('../log.js'),
    files = require('../files.js'),
    sass = require('../sass.js'),
    script = require('../script.js'),
    template = require('../template.js');

function getConfig(path) {
    var fullPath = process.cwd() + path;
    if (fs.existsSync(fullPath)) {
        return require(fullPath);
    }
    return false;
}

function getDemoConfig(name, defaultConfig, overrideConfig) {
    var opts = extend(true, defaultConfig, overrideConfig);
    opts.name = name;
    return opts;
}

function buildSass(demoConfig, callback) {
    var src = process.cwd() + '/' + demoConfig.sass,
        dest = process.cwd() + '/demos/' + path.basename(demoConfig.sass).replace('.scss', '.css');
    if (fs.existsSync(src)) {
        log.secondary("Compiling SASS: " + src);
        sass.compileWithVars(src, dest, {
            "o-assets-global-path": '"http://build.origami.ft.com/files/"'
        }, callback);
    } else {
        callback();
    }
}

function buildJs(demoConfig, callback) {
    var src = process.cwd() + '/' + demoConfig.js,
        dest = process.cwd() + '/demos/' + path.basename(demoConfig.js);
    if (fs.existsSync(src)) {
        log.secondary("Browserifying: " + src);
        script.runBrowserify(files.getModuleName(), src, dest, callback);
    } else {
        callback();
    }
}

function getDemoWarning(staticSource) {
    if (staticSource === "local") {
        return '<div class="demo-message"><strong>Warning:</strong> Demo built for local static assets. Do not commit this file. Run <code>origami-build-tools demo &lt;config&gt; --buildservice</code> instead.</div>';
    }
    return "";
}

function buildHtml(demoConfig, staticSource, callback) {
    var src = process.cwd() + '/' + demoConfig.template,
        dest = process.cwd() + '/demos/' + demoConfig.name + '.html',
        data = {};
    if (fs.existsSync(src)) {
        if (demoConfig.data) {
            var dataPath = process.cwd() + '/' + demoConfig.data;
            if (fs.existsSync(dataPath)) {
                data = require(dataPath);
            }
        }
        data.oDemoMessage = getDemoWarning(staticSource);
        data.oDemoTitle = files.getModuleName() + ': ' + demoConfig.name + ' demo';
        data.oDemoStyle = '<link rel="stylesheet" href="' + getStylesheetHref(demoConfig.sass, staticSource) + '" />';
        data.oDemoScript = '<script src="' + getScriptSrc(demoConfig.js) + '" />';
        log.secondary("Rendering: " + src);
        template.render(src, dest, data, callback);
    } else {
        callback();
    }
}

function getStylesheetHref(sassPath, staticSource) {
    if (staticSource === 'local') {
        return path.basename(sassPath).replace('.scss', '.css');
    } else {
        return '/bundles/css?modules=' + files.getModuleName() + '&main=' + files.getModuleName() + '/' + sassPath;
    }
}

function getScriptSrc(scriptPath) {
    return path.basename(scriptPath);
}

function buildDemos(configPath, staticSource) {
    if (getConfig(configPath)) {
        var demosConfig = getConfig(configPath);
        async.eachSeries(Object.keys(demosConfig.demos), function(name, outerCallback) {
            var demoConfig = getDemoConfig(name, demosConfig.options, demosConfig.demos[name]);
            async.parallel([
                function(innerCallback) {
                    buildSass(demoConfig, innerCallback);
                },
                function(innerCallback) {
                    buildJs(demoConfig, innerCallback);
                },
                function(innerCallback) {
                    buildHtml(demoConfig, staticSource, innerCallback);
                }
            ], function (err) {
                if (err) {
                    log.primaryError(err);
                } else {
                    log.primary("Demo '" + name + "' done.");
                }
                outerCallback();
            });
        }, function(err) {
            if (err) {
                log.primaryError(err);
            } else {
                log.primary("All demos done.");
            }
        });

    } else {
        log.secondaryError("Couldn't find config path: " + configPath);
    }
}

exports.local = function(configPath) {
    log.primary("Build demos for local development");
    buildDemos(configPath, "local");
};

exports.buildService = function(configPath) {
    log.primary("Build demos for build service");
    buildDemos(configPath, "buildservice");
};