"use strict";

var fs = require('fs'),
    mustache = require('mustache');

function loadTemplate(templatePath) {
    return fs.readFileSync(templatePath, { encoding: 'utf-8' });
}

function render(src, dest, data, callback) {
    var pageTemplate = loadTemplate(__dirname + '/../templates/page.mustache'),
        demoTemplate = loadTemplate(src),
        completeTemplate = pageTemplate.replace("{{{oDemoTpl}}}", demoTemplate);
    var output = mustache.render(completeTemplate, data);
    fs.writeFile(dest, output, { encoding: 'utf-8' }, callback);
}

exports.render = render;
