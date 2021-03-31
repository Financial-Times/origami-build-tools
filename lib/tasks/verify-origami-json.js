'use strict';

const process = require('process');
const fs = require('fs');
const path = require('path');
const denodeify = require('util').promisify;
const isCI = require('is-ci');

const fileExists = file => denodeify(fs.open)(file, 'r').then(() => true).catch(() => false);
const readFile = denodeify(fs.readFile);

function origamiJson(config) {
	const result = [];

	const origamiJsonPath = path.join(config.cwd, '/origami.json');
	return fileExists(origamiJsonPath)
		.then(exists => {
			if (exists) {
				return readFile(origamiJsonPath, 'utf8')
					.then(file => {
						const origamiJson = JSON.parse(file);
						const componentDemos = origamiJson.demos;
						if (origamiJson.origamiType !== 'imageset' && origamiJson.origamiType !== 'module' && origamiJson.origamiType !== 'service') {
							result.push('The origamiType property needs to be set to either "imageset", "module" or "service"');
						}
						if (typeof origamiJson.origamiVersion === 'number') {
							result.push('The origamiVersion property must be a string.');
						}
						if (typeof origamiJson.origamiVersion !== 'string' || origamiJson.origamiVersion.split('.')[0] !== '2') {
							result.push('The origamiVersion property needs to be set to "2.0" or higher, this version of Origami Build tools only supports v2 of the Origami component specification.');
						}
						if (!origamiJson.support) {
							result.push('The support property must be an email or url to an issue tracker for this module');
						}
						if (!['active', 'maintained', 'deprecated', 'dead', 'experimental'].includes(origamiJson.supportStatus)) {
							result.push('The supportStatus property must be set to either "active", "maintained", "deprecated", "dead" or "experimental"');
						}

						if (componentDemos) {
							const hasExpanded = componentDemos.some(function (demo) {
								return Object.prototype.hasOwnProperty.call(demo, 'expanded');
							});

							if (hasExpanded) {
								result.push('The expanded property has been deprecated. Use the "hidden" property when a demo should not appear in the Registry.');
							}

							const hasInvalidTitle = componentDemos.some(function (demo) {
								return !(demo.title && typeof demo.title === 'string' && demo.title.trim().length > 0);
							});
							if (hasInvalidTitle) {
								result.push('All demos require a title property which is non-empty and of type "string".');
							}
						}

						if (result.length > 0) {
							const message = 'Failed linting:\n\n' + result.join('\n') + '\n\nThe origami.json file does not conform to the specification at http://origami.ft.com/docs/syntax/origamijson/';
							if (isCI) {
								const newLine = "%0A";
								console.log(`::error file=origami.json,line=1,col=1::${message.replace(/\n/g, newLine)}`);
							}
							const e = new Error(message);
							e.stack = '';
							throw e;
						} else {
							return result;
						}
					});
			}
		});
}

module.exports = cfg => {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	return {
		title: 'Verifying your origami.json',
		task: () => origamiJson(config),
		skip: function () {
			const origamiJsonPath = path.join(config.cwd, '/origami.json');

			return fileExists(origamiJsonPath)
				.then(exists => {
					if (!exists) {
						return `No origami.json file found. To make this an origami component, create a file at ${path.join(config.cwd, '/origami.json')} following the format defined at: http://origami.ft.com/docs/syntax/origamijson/`;
					}
				});
		}
	};
};
