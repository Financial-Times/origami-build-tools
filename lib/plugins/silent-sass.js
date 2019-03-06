'use strict';

module.exports = function silentSass(config) {
	return function (css) {
		if (config.silent && css.length !== 0) {
			throw new Error('CSS was output with silent mode on.');
		}
	};
};
