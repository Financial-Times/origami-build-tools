'use strict';

const {run} = require('../helpers/command-line');
module.exports = function () {
	return run('npm', ['init', 'origami-component']);
};

module.exports.watchable = false;
