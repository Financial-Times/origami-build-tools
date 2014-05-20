/*global require, process, exports */

var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    extend = require('node.extend'),
    jsonFile = require('json-file-plus'),
    log = require('../log.js'),
    files = require('../files.js'),
    sass = require('../sass.js'),
    script = require('../script.js'),
    template = require('../template.js'),
    builtFiles = {},
    defaultDemoConfig = {
        bodyClasses: ""
    };

function getConfig(path) {
    "use strict";
    var fullPath = process.cwd() + '/' + path;
    if (fs.existsSync(fullPath)) {
        return require(fullPath);
    }
    return false;
}

function getDemoConfig(name, defaultConfig, overrideConfig) {
    "use strict";
    var opts = extend(true, {}, defaultDemoConfig, defaultConfig, overrideConfig);
    opts.name = name;
    return opts;
}

function buildSass(demoConfig, callback) {
    "use strict";
    var src = process.cwd() + '/' + demoConfig.sass,
        dest = process.cwd() + '/demos/' + path.basename(demoConfig.sass).replace('.scss', '.css');
    if (fs.existsSync(src) && builtFiles.css.indexOf(dest) === -1) {
        log.secondary("Compiling SASS: " + src);
        sass.compileWithVars(src, dest, {
                "o-assets-global-path": '"http://build.origami.ft.com/files/"'
            },
            { sourcemap: true },
            function () {
                builtFiles.css.push(dest);
                callback();
            });
    } else {
        callback();
    }
}

function buildJs(demoConfig, callback) {
    "use strict";
    var src = process.cwd() + '/' + demoConfig.js,
        dest = process.cwd() + '/demos/' + path.basename(demoConfig.js);
    if (fs.existsSync(src) && builtFiles.js.indexOf(dest) === -1) {
        log.secondary("Browserifying: " + src);
        script.runBrowserify(files.getModuleName(), src, dest, function () {
            builtFiles.js.push(dest);
            callback();
        });
    } else {
        callback();
    }
}

function getDemoWarning(staticSource) {
    "use strict";
    if (staticSource === "local") {
        var html = [
            '<style>',
            '.demo-message { margin: 0 0 10px 0; border-bottom: 1px solid #ddcc66; padding: 3px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; text-align: center; background-color: #ffee88; color: #333; }',
            '</style>',
            '<div class="demo-message"><strong>Warning:</strong> Demo built for local static assets. Do not commit this file. Run <code>origami-build-tools demo &lt;config&gt; --buildservice</code> instead.</div>'
        ];
        return html.join('');
    }
    return "";
}

function buildHtml(demoConfig, staticSource, callback) {
    "use strict";
    var src = process.cwd() + '/' + demoConfig.template,
        dest = process.cwd() + '/demos/' + demoConfig.name + '.html',
        data = {};
    if (fs.existsSync(src) && builtFiles.html.indexOf(dest) === -1) {
        if (typeof demoConfig.data === 'string') {
            var dataPath = process.cwd() + '/' + demoConfig.data;
            if (fs.existsSync(dataPath)) {
                data = require(dataPath);
            }
        } else if (typeof demoConfig.data === 'object') {
            data = demoConfig.data;
        }
        data.oDemoMessage = getDemoWarning(staticSource);
        data.oDemoTitle = files.getModuleName() + ': ' + demoConfig.name + ' demo';
        data.oDemoStyle = '<link rel="stylesheet" href="' + getStylesheetHref(demoConfig.sass, staticSource) + '" />';
        if (demoConfig.js) {
            data.oDemoScript = '<script src="' + getScriptSrc(demoConfig.js, staticSource) + '"></script>';
        }
        data.oDemoBodyClasses = demoConfig.bodyClasses;
        log.secondary("Rendering: " + dest);
        template.render(src, dest, data, function () {
            builtFiles.html.push(dest);
            callback();
        });
    } else {
        callback();
    }
}

function getStylesheetHref(sassPath, staticSource) {
    "use strict";
    if (staticSource === 'local') {
        return path.basename(sassPath).replace('.scss', '.css');
    } else {
        return '/bundles/css?modules=' + files.getModuleName() + ((sassPath !== "main.scss") ? ':/' + sassPath : '');
    }
}

function getScriptSrc(scriptPath, staticSource) {
    "use strict";
    if (staticSource === 'local') {
        return path.basename(scriptPath);
    } else {
        return '/bundles/js?modules=' + files.getModuleName() + ((scriptPath !== "main.js") ? ':/' + scriptPath : '');
    }
}

function updateOrigamiJsonDemoList(demoList, callback) {
    "use strict";
    jsonFile(process.cwd() + '/origami.json', function (err, origamiFile) {
        if (err) {
            callback();
            return;
        }
        if (demoList) {
            origamiFile.data.demos = demoList;
        } else {
            delete origamiFile.data.demos;
        }
        origamiFile.save(callback);
    });
}

function buildDemos(configPath, staticSource, updateOrigami, callback) {
    "use strict";
    if (typeof callback !== "function") {
        callback = function () {};
    }
    if (getConfig(configPath)) {
        log.primary("Build demos for " + staticSource + " using config file at " + configPath);

        var demosConfig = getConfig(configPath);
        builtFiles.css = [];
        builtFiles.js = [];
        builtFiles.html = [];
        async.eachSeries(Object.keys(demosConfig.demos), function (name, outerCallback) {
            var demoConfig = getDemoConfig(name, demosConfig.options, demosConfig.demos[name]),
                demoTasks = [function (innerCallback) {
                    buildHtml(demoConfig, staticSource, innerCallback);
                }];
            if (staticSource === "local") {
                demoTasks.unshift(function (innerCallback) {
                    buildSass(demoConfig, innerCallback);
                });
                demoTasks.unshift(function (innerCallback) {
                    buildJs(demoConfig, innerCallback);
                });
            }
            async.parallel(demoTasks, function (err) {
                if (err) {
                    log.primaryError(err);
                } else {
                    log.primary("Demo '" + name + "' done.");
                }
                outerCallback();
            });
        }, function (err) {
            if (err) {
                log.primaryError(err);
                callback(err);
            } else {
                log.primary("All demos done.");
                if (updateOrigami) {
                    log.primary('Updating origami.json demo list...');
                    updateOrigamiJsonDemoList(builtFiles.html.map(function (p) {
                        return '/demos/' + path.basename(p);
                    }), callback);
                }
            }
        });

    } else {
        log.secondaryError("Couldn't find config path: " + configPath);
    }
}

exports.run = buildDemos;