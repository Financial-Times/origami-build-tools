'use strict';

const path = require('path');
const files = require('../helpers/files');

const constructBrowserDeps = () => {
	const globby = require('globby');
	const bower = files.getBowerJson();

	if (bower) {
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
				return `https://polyfill.io/v2/polyfill.js?features=default,${features.join(',')}&flags=gated&unknown=polyfill`;
			});
	}

	return Promise.resolve('https://polyfill.io/v2/polyfill.js?features=default&flags=gated&unknown=polyfill');

};

module.exports = constructBrowserDeps;
