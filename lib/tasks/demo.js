/*global require, process, exports */

'use strict';

var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    extend = require('node.extend'),
    sass = require('gulp-ruby-sass'),
    mustache = require('gulp-mustache'),
    source = require('vinyl-source-stream'),
    rename = require('gulp-rename'),
    webserver = require('gulp-webserver'),
    browserify = require('browserify'),
    prefixer = require('../plugins/gulp-prefixer.js'),
    commandLine = require('../helpers/command-line'),
    log = require('../helpers/log.js'),
    files = require('../helpers/files.js'),
    builtFiles = {},
    defaultDemoConfig = {
        bodyClasses: "",
        description: "",
        expanded: true
    };

function buildSass(gulp, demoConfig) {
    var src = process.cwd() + '/' + demoConfig.sass,
        dest = process.cwd() + '/demos/local/';
    if (fs.existsSync(src) && builtFiles.css.indexOf(src) === -1) {
        log.secondary("Compiling SASS: " + demoConfig.sass);
        var bowerConfig = files.getBowerJson(),
            prefixSass = '';
        // If module has o-assets as a dependency, set local demos to use local assets
        if (bowerConfig.dependencies && bowerConfig.dependencies['o-assets']) {
            var moduleName = bowerConfig.name;
            prefixSass = '@import "o-assets/main";\n'+
                '@include oAssetsSetModulePaths(('+moduleName+': ""));\n';
        }
        builtFiles.css.push(src);
        return gulp.src(src)
            .pipe(prefixer(prefixSass))
            // For the SASS files to load correctly, they need to be in one of these two directories. SASS doesn't look in subdirectories and we can't use wildcards
            .pipe(sass({loadPath: ['demos/src', 'demos/src/scss', 'bower_components'], style: 'compressed'}))
            .on('error', function(err) { console.log(err.message);})
            .pipe(gulp.dest(dest));
    }
}

function buildJs(gulp, demoConfig) {
    var src = process.cwd() + '/' + demoConfig.js,
        destFolder = process.cwd() + '/demos/local/',
        dest = path.basename(demoConfig.js);
    if (fs.existsSync(src) && builtFiles.js.indexOf(src) === -1) {
        log.secondary("Browserifying: " + demoConfig.js);
        builtFiles.js.push(src);
        return browserify(src)
            .require(src, {})
            .transform({}, 'debowerify')
            .transform({}, 'textrequireify')
            .bundle({debug: true})
            .pipe(source(dest))
            .pipe(gulp.dest(destFolder));
    }
}

function buildHtml(gulp, demoConfig, staticSource) {
    var src = process.cwd() + '/' + demoConfig.template,
        dest = 'demos/' + (staticSource === 'local' ? 'local/' : ''),
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
        data.oDemoTitle = files.getModuleName() + ': ' + demoConfig.name + ' demo';
        if (demoConfig.sass) {
            data.oDemoStyle = '<link rel="stylesheet" href="' + getStylesheetHref(demoConfig.sass, staticSource) + '" />';
        }
        if (demoConfig.js) {
            data.oDemoScript = '<script src="' + getScriptSrc(demoConfig.js, staticSource) + '"></script>';
        }
        data.oDemoBodyClasses = demoConfig.bodyClasses;
        data.oDemoTpl = fs.readFileSync(src, {encoding: 'utf8'});
        log.secondary("Rendering: " + dest + demoConfig.name + '.html');
        builtFiles.html.push(src);
        if (staticSource !== 'local') {
            demoConfig.outputHtmlPath = dest;
        }
        return gulp.src(__dirname + '/../../templates/page.mustache')
            .pipe(mustache(data))
            .pipe(rename(demoConfig.name + '.html'))
            .pipe(gulp.dest(dest));
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

function convertToNewFormat(demosConfig) {
    var demoArray = [],
        demoConfig;
    for (var demoName in demosConfig) {
        if (demosConfig.hasOwnProperty(demoName)) {
            demoConfig = demosConfig[demoName];
            demoConfig.name = demoName;
            demoArray.push(demoConfig);
        }
    }
    return demoArray;
}

function hasUniqueNames(demos) {
    var names = {}
    for (var i = 0; i < demos.length; i++) {
        if (names[demos[i].name]) {
            return false;
        }
        names[demos[i].name] = true;
    }
    return true;
}

function updateOrigamiJsonDemoList(demosBuilt, callback) {
    var origamiDemoConfig = demosBuilt.filter(function(conf) {
        if (conf.outputHtmlPath) {
            return true;
        }
    }).map(function(conf) {
        return {
            path: "/" + conf.outputHtmlPath,
            expanded: conf.expanded,
            description: conf.description
        };
    });

    if (origamiDemoConfig.length > 0) {
        var origamiJsonPath = path.join(process.cwd(), 'origami.json'),
            origamiJsonFile = fs.readFileSync(origamiJsonPath, { encoding: 'utf8' }),
            origamiJson = JSON.parse(origamiJsonFile);
        origamiJson.demos = origamiDemoConfig;
        origamiJson = JSON.stringify(origamiJson, null, 4);
        fs.writeFileSync(origamiJsonPath, origamiJson, { encoding: 'utf8' });
    }
}

function runServer(gulp, config) {
    var portfinder = require('portfinder');
    portfinder.basePort = 8080;
    portfinder.getPort(function (err, port) {
        if (err) throw err;
        log.primary('Load in browser to view demos: http://localhost:'+port+'/demos/local/');
        return gulp.src('.')
            .pipe(webserver({
                livereload: true,
                directoryListing: true,
                open: true
            }));
    });
}

module.exports = function(gulp, config) {
    var configPath = (config._ && config._[1]) ? config._[1] : false;
    if (!configPath) {
        ["demos/src/config.json", "demos/src/config.js"].forEach(function(path) {
            if (fs.existsSync(path)) {
                configPath = path;
            }
        });
    }
    if (fs.existsSync(configPath)) {
        log.primary("Building" + (config.local ? " local and" : "") + " build service demos (config: " + configPath + ')');

        var demosConfig = require(process.cwd() + '/' + configPath),
            demos = [];
        builtFiles.css = [];
        builtFiles.js = [];
        builtFiles.html = [];

        if (!Array.isArray(demosConfig.demos)) {
            log.primary('WARNING: Deprecated demo config format. Demo task will run converting it to the new one...');
            demosConfig.demos = convertToNewFormat(demosConfig.demos);
        }

        if (!hasUniqueNames(demosConfig.demos)) {
            log.primaryError("Demo names are not unique. Can't build demos.");
            return;
        }

        demosConfig.demos.forEach(function(demoConfig) {
            demos.push(extend(true, defaultDemoConfig, demosConfig.options, demoConfig));
        });

        demos.forEach(function(demo) {
            log.secondary('Building demo ' + demo.name);

            buildHtml(gulp, demo, 'buildservice');
            if (config.local) {
                buildHtml(gulp, demo, 'local');
                buildSass(gulp, demo);
                buildJs(gulp, demo);
            }
        });

        if (!config.updateOrigami) {
            log.secondary('Tip: Add --updateorigami to automatically update origami.json with new demo metadata');
        } else {
            log.primary('Updating origami.json demo list...');
            updateOrigamiJsonDemoList(demos);
        }

        if (config.local) {
            runServer(gulp);
        }
    } else {
        log.secondaryError("Couldn't find config path: " + configPath);
    }
}

module.exports.watchable = true;
module.exports.description = 'Builds the demos';
