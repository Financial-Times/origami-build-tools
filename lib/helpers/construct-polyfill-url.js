'use strict';

const path = require('path');
const globby = require('globby');

const constructBrowserDeps = () => {

	return globby(['bower_components/*/origami.json', 'origami.json'])
		.then(dependencies => {
			const requiredFeatures = [];

			for (const dependency of dependencies) {
				const origami = require(path.resolve(dependency));
				if (origami.browserFeatures && origami.browserFeatures.required) {
					requiredFeatures.push(...origami.browserFeatures.required);
				}
			}

			const features = Array.from(new Set(requiredFeatures));
			if (features.length > 0) {
				return `https://polyfill.io/v2/polyfill.js?features=default,${features.join(',')}&flags=gated&unknown=polyfill`;
			} else {
				return 'https://polyfill.io/v2/polyfill.js?features=default&flags=gated&unknown=polyfill';
			}
		});
};

module.exports = constructBrowserDeps;
