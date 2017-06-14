'use strict';

const denodeify = require('denodeify');

module.exports = denodeify(require('rimraf'));
