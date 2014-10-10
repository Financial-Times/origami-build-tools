'use strict';

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
    },
    localserver;

function getConfig(path) {
    var fullPath = process.cwd() + '/' + path;
    if (fs.existsSync(fullPath)) {
        return require(fullPath);
    }
    return false;
}

function convertToNewFormat(demosConfig) {
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
    return extend(true, {}, defaultDemoConfig, defaultConfig, overrideConfig);
}

function getDemoBuildConfig(demosConfig, name) {
    for (var c = 0, l = demosConfig.length; c < l; c++) {
        if (demosConfig[c].name === name) {
            return demosConfig[c];
        }
    }
}

function buildSass(demoConfig, callback) {
    var src = process.cwd() + '/' + demoConfig.sass,
        dest = process.cwd() + '/demos/local/' + path.basename(demoConfig.sass).replace('.scss', '.css');
    if (fs.existsSync(src) && builtFiles.css.indexOf(dest) === -1) {
        log.secondary("Compiling SASS: " + demoConfig.sass);
        var bowerConfig = files.getBowerJson();
        var sassFile = fs.readFileSync(src, 'utf8');
        // If module has o-assets as a dependency, set local demos to use local assets
        if (bowerConfig.dependencies && bowerConfig.dependencies['o-assets']) {
            var moduleName = bowerConfig.name;
            sassFile = '@import "o-assets/main";\n'+
                '@include oAssetsSetModulePaths(('+moduleName+': ""));\n'+
                sassFile;
        }
        sass.compile(sassFile, dest, {
                sourcemap: false,
                // For the SASS files to load correctly, they need to be in one of these two directories. SASS doesn't look in subdirectories and we can't use wildcards
                loadPaths: ['demos/src', 'demos/src/scss']
            },
            function () {
                builtFiles.css.push(dest);
                callback();
            });
    } else {
        callback();
    }
}

function buildJs(demoConfig, callback) {
    var src = process.cwd() + '/' + demoConfig.js,
        dest = process.cwd() + '/demos/local/' + path.basename(demoConfig.js);
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
    if (staticSource === "local") {
        var html = [
            '<style>',
            '.demo-message { position: fixed; left:0 ; right: 0; bottom: 0; border-top: 1px solid #ddcc66; padding: 3px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; text-align: center; background-color: #ffee88; color: #333; }',
            '</style>',
            '<div class="demo-message"><strong>Warning:</strong> Demo built for local static assets. Do not commit this file.</div>'
        ];
        return html.join('');
    }
    return "";
}

function buildHtml(demoConfig, staticSource, callback) {
    var src = process.cwd() + '/' + demoConfig.template,
        dest = 'demos/' + (staticSource === 'local' ? 'local/' : '') + demoConfig.name + '.html',
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
        if (demoConfig.sass) {
            data.oDemoStyle = '<link rel="stylesheet" href="' + getStylesheetHref(demoConfig.sass, staticSource) + '" />';
        }
        if (demoConfig.js) {
            data.oDemoScript = '<script src="' + getScriptSrc(demoConfig.js, staticSource) + '"></script>';
        }
        data.oDemoBodyClasses = demoConfig.bodyClasses;
        log.secondary("Rendering: " + dest);
        template.render(src, process.cwd() + '/' + dest, data, function () {
            if (staticSource !== 'local') {
                demoConfig.outputHtmlPath = dest;
            }
            builtFiles.html.push(dest);
            callback();
        });
    } else {
        callback();
    }
}

function getStylesheetHref(sassPath, staticSource) {
    if (staticSource === 'local') {
        return path.basename(sassPath).replace('.scss', '.css');
    } else {
        return '/bundles/css?modules=' + files.getModuleName() + ((sassPath !== "main.scss") ? ':/' + sassPath : '');
    }
}

function getScriptSrc(scriptPath, staticSource) {
    if (staticSource === 'local') {
        return path.basename(scriptPath);
    } else {
        return '/bundles/js?modules=' + files.getModuleName() + ((scriptPath !== "main.js") ? ':/' + scriptPath : '');
    }
}

function hasUniqueNames(a) {
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

function runLocalDemosServer(callback) {
    if (localserver) {
	    localserver.close();
    }
    var portfinder = require('portfinder');
    portfinder.basePort = 8080;
    portfinder.getPort(function (err, port) {
        if (err) {
		throw err;
	}

        // Run server in the root of the component so all assets load properly
        localserver = require('http-server').createServer({
            root: process.cwd(),
            cache: -1,
            showDir: true,
            autoIndex: true,
            ext: undefined,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
        localserver.listen(port);
        log.primary('Load in browser to view demos: http://127.0.0.1:'+port+'/demos/local/');
        callback();
    });
}

function buildDemos(configPath, buildLocal, updateOrigami, callback) {
    if (typeof callback !== "function") {
        callback = function () {};
    }
    if (getConfig(configPath)) {
        log.primary("Building" + (buildLocal ? " local and" : "") + " build service demos (config: " + configPath + ')');

        if (buildLocal && !fs.existsSync('demos/local/')) {
            fs.mkdirSync('demos/local/');
        }
        if (!updateOrigami) {
            log.secondary('Tip: Add --updateorigami to automatically update origami.json with new demo metadata');
        }

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
                    buildHtml(demoConfig, "buildservice", innerCallback);
                }];
            if (buildLocal) {
                demoTasks.unshift(function(innerCallback) {
                    buildHtml(demoConfig, "local", innerCallback);
                });
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
                    log.secondary("Demo '" + demoConfig.name + "' done.");
                }
                outerCallback();
            });
        }, function(err) {
            if (err) {
                log.primaryError(err);
                callback(err);
            } else {
                log.secondary("Finished building demos");
                if (buildLocal) {
                    runLocalDemosServer(function(error) {
                        callback(error);
                    });
                } else if (updateOrigami) {
                    log.primary('Updating origami.json demo list...');
                    updateOrigamiJsonDemoList(demosBuildConfig, callback);
                } else {
                    callback();
                }
            }
        });

    } else {
        log.secondaryError("Couldn't find config path: " + configPath);
    }
}

exports.run = buildDemos;
