/*global require, exports */

var files = require('./files'),
    log = require('./log');

function mainSass() {
    "use strict";
    var bowerJson = files.getBowerJson(),
        fileExists = files.sassExists(),
        isInBowerMain = (bowerJson && bowerJson.main && bowerJson.main.indexOf('main.scss') > -1);
    if (isInBowerMain && !fileExists) {
        log.primaryError("main.scss is listed in bower.json main, but file doesn't exist.");
    } else if (!isInBowerMain && fileExists) {
        log.primaryError("main.scss exists but is not listed in bower.json main.");
    }
    return (isInBowerMain && fileExists);
}

function mainJs() {
    "use strict";
    var bowerJson = files.getBowerJson(),
        fileExists = files.jsExists(),
        isInBowerMain = (bowerJson && bowerJson.main && bowerJson.main.indexOf('main.js') > -1);
    if (isInBowerMain && !fileExists) {
        log.primaryError("main.js is listed in bower.json main, but file doesn't exist.");
    } else if (!isInBowerMain && fileExists) {
        log.primaryError("main.js exists but is not listed in bower.json main.");
    }
    return (isInBowerMain && fileExists);
}

exports.mainSass = mainSass;
exports.mainJs = mainJs;