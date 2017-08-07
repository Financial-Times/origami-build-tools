'use strict';

const process = require('process');
const fs = require('fs');
const path = require('path');
const denodeify = require('denodeify');

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
						if (!origamiJson.description) {
							result.push('A non-empty description property is required');
						}
						if (origamiJson.origamiType !== 'module' && origamiJson.origamiType !== 'service') {
							result.push('The origamiType property needs to be set to either "module" or "service"');
						}
						if (origamiJson.origamiVersion !== 1) {
							result.push('The origamiVersion property needs to be set to 1');
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
						}

						if (result.length > 0) {
							const e = new Error('Failed linting:\n\n' + result.join('\n') + '\n\nThe origami.json file does not conform to the specification at http://origami.ft.com/docs/syntax/origamijson/');
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
