'use strict';

module.exports = function silentSass(config) {
	return function (css) {
		if (!(config.silent && css.length === 0 || !config.silent && css.length > 0)) {
			throw new Error('sass compilation for silent mode: ' + config.silent + ' failed.');
		}
	};
};
