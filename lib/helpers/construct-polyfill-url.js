'use strict';

const path = require('path');
const globby = require('globby');
const denodeify = require('denodeify');
const readFile = denodeify(require('fs-extra').readFile);

function constructBrowserDeps() {
	return globby(['bower_components/*/origami.json', 'origami.json'])
		.then(dependencies => {
			return Promise.all(dependencies.map(dependency => {
				if (dependency.startsWith('/')) {
					dependency = dependency.substr(1);
				}
				return readFile(path.resolve(dependency), 'utf-8');
			}));
		})
		.then(origamiJsons => {
			const requiredFeatures = [];
			origamiJsons.forEach(origamiJson => {
				const origami = JSON.parse(origamiJson);
				if (origami.browserFeatures && origami.browserFeatures.required) {
					requiredFeatures.push(...origami.browserFeatures.required);
				}
			});

			return requiredFeatures;
		})
		.then(requiredFeatures => {
			const features = Array.from(new Set(requiredFeatures));
			if (features.length > 0) {
				return `https://polyfill.io/v2/polyfill.js?features=,${features.join(',')}&flags=gated&unknown=polyfill`;
			} else {
				return 'https://polyfill.io/v2/polyfill.js?flags=gated&unknown=polyfill';
			}
		});
}

module.exports = constructBrowserDeps;
