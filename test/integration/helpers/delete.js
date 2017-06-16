'use strict';

const denodeify = require('denodeify');

/**
 * A promisfied version of the `rm -rf` unix command.
*/
module.exports = denodeify(require('rimraf'));
