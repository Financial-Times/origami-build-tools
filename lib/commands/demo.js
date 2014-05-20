/*global require, process, exports */

var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    extend = require('node.extend'),
    log = require('../log.js'),
    files = require('../files.js'),
    sass = require('../sass.js'),
    script = require('../script.js'),
    template = require('../template.js'),
    builtFiles = {},
    defaultDemoConfig = {
        bodyClasses: "",
        description: "",
        expanded: true
    };

function getConfig(path) {
    "use strict";
    var fullPath = process.cwd() + '/' + path;
    if (fs.existsSync(fullPath)) {
        return require(fullPath);
    }
    return false;
}

function convertToNewFormat(demosConfig) {
    "use strict";
    var demoArray = [],
        demoName,
        demoConfig;
    for (demoName in demosConfig) {
        if (demosConfig.hasOwnProperty(demoName)) {
            demoConfig = extend(true, {}, demosConfig[demoName]);
            demoConfig.name = demoName;
            demoArray.push(demoConfig);
        }
    }
    return demoArray;
}

function getDemoConfig(defaultConfig, overrideConfig) {
    "use strict";
    return extend(true, {}, defaultDemoConfig, defaultConfig, overrideConfig);
}

function getDemoBuildConfig(demosConfig, name) {
    "use strict";
    for (var c = 0, l = demosConfig.length; c < l; c++) {
        if (demosConfig[c].name === name) {
            return demosConfig[c];
        }
    }
}

function buildSass(demoConfig, callback) {
    "use strict";
    var src = process.cwd() + '/' + demoConfig.sass,
        dest = process.cwd() + '/demos/' + path.basename(demoConfig.sass).replace('.scss', '.css');
    if (fs.existsSync(src) && builtFiles.css.indexOf(dest) === -1) {
        log.secondary("Compiling SASS: " + demoConfig.sass);
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
        log.secondary("Browserifying: " + demoConfig.js);
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
        dest = 'demos/' + demoConfig.name + '.html',
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
        template.render(src, process.cwd() + '/' + dest, data, function () {
            demoConfig.outputHtmlPath = dest;
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

function hasUniqueNames(a) {
    "use strict";
    var names = {}, c, l;
    for (c = 0, l = a.length; c < l; c++) {
        if (names[a[c].name]) {
            return false;
        }
        names[a[c].name] = true;
    }
    return true;
}

function updateOrigamiJsonDemoList(demosBuilt, callback) {
    "use strict";
    var origamiDemoConfig;
    if (Array.isArray(demosBuilt)) {
        origamiDemoConfig = demosBuilt.filter(function (conf) {
            if (conf.outputHtmlPath) {
                return conf;
            }
        }).map(function (conf) {
            return {
                path: "/" + conf.outputHtmlPath,
                expanded: conf.expanded,
                description: conf.description
            };
        });
    } else {
        origamiDemoConfig = [];
    }
    if (origamiDemoConfig.length > 0) {
        var origamiJsonPath = path.join(process.cwd(), 'origami.json'),
            origamiJsonFile = fs.readFileSync(origamiJsonPath, { encoding: 'utf8' }),
            origamiJson = JSON.parse(origamiJsonFile);
        origamiJson.demos = origamiDemoConfig;
        origamiJson = JSON.stringify(origamiJson, null, 4);
        fs.writeFileSync(origamiJsonPath, origamiJson, { encoding: 'utf8' });
        callback();
    } else {
        callback();
    }
}

function buildDemos(configPath, staticSource, updateOrigami, callback) {
    "use strict";
    if (typeof callback !== "function") {
        callback = function () {};
    }
    if (getConfig(configPath)) {
        log.primary("Build demos for " + staticSource + " using config file at " + configPath);

        var demosConfig = getConfig(configPath),
            demoNames = [],
            demosBuildConfig = [];
        builtFiles.css = [];
        builtFiles.js = [];
        builtFiles.html = [];

        if (!Array.isArray(demosConfig.demos)) {
            log.primary('WARNING: Deprecated demo config format. Converting to new format...');
            demosConfig.demos = convertToNewFormat(demosConfig.demos);
        }

        if (!hasUniqueNames(demosConfig.demos)) {
            log.primaryError("Demo names are not unique. Can't build demos.");
            callback();
        }

        demosConfig.demos.forEach(function(demoConfig) {
            demoNames.push(demoConfig.name);
            demosBuildConfig.push(getDemoConfig(demosConfig.options, demoConfig));
        });

        async.eachSeries(demoNames, function (demoName, outerCallback) {
            var demoConfig = getDemoBuildConfig(demosBuildConfig, demoName),
                demoTasks = [function(innerCallback) {
                    buildHtml(demoConfig, staticSource, innerCallback);
                }];
            if (staticSource === "local") {
                demoTasks.unshift(function(innerCallback) {
                    buildSass(demoConfig, innerCallback);
                });
                demoTasks.unshift(function(innerCallback) {
                    buildJs(demoConfig, innerCallback);
                });
            }
            async.parallel(demoTasks, function(err) {
                if (err) {
                    log.primaryError(err);
                } else {
                    log.primary("Demo '" + demoConfig.name + "' done.");
                }
                outerCallback();
            });
        }, function(err) {
            if (err) {
                log.primaryError(err);
                callback(err);
            } else {
                log.primary("All demos done.");
                if (updateOrigami) {
                    log.primary('Updating origami.json demo list...');
                    updateOrigamiJsonDemoList(demosBuildConfig, callback);
                    callback();
                }
            }
        });

    } else {
        log.secondaryError("Couldn't find config path: " + configPath);
    }
}

exports.run = buildDemos;