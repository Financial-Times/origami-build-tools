'use strict';

const fs = require('fs');
const path = require('path');

function origamiJson () {
	return new Promise(function(resolve, reject) {
		const result = [];

		const origamiJsonPath = path.join(process.cwd(), '/origami.json');
		if (fs.existsSync(origamiJsonPath)) {
			const origamiJson = JSON.parse(fs.readFileSync(origamiJsonPath, 'utf8'));
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
			if (['active', 'maintained', 'deprecated', 'dead', 'experimental'].indexOf(origamiJson.supportStatus) === -1) {
				result.push('The supportStatus property must be set to either "active", "maintained", "deprecated", "dead" or "experimental"');
			}

			if (componentDemos) {
				const hasExpanded = componentDemos.some(function(demo) {
					return demo.hasOwnProperty('expanded');
				});

				if (hasExpanded) {
					result.push('The expanded property has been deprecated. Use the "hidden" property when a demo should not appear in the Registry.');
				}
			}

			if (result.length > 0) {
				reject(new Error('Failed linting:\n\n' + result.join('\n') + '\n\nThe origami.json file does not conform to the specification at http://origami.ft.com/docs/syntax/origamijson/'));
			} else {
				resolve(result);
			}
		}
	});
};

module.exports = {
	title: 'Verifying your origami.json',
	task: origamiJson,
	skip: () => {
		const origamiJsonPath = path.join(process.cwd(), '/origami.json');
		if (!fs.existsSync(origamiJsonPath)) {
			return `No origami.json file found. To make this an origami component, create a file at ${path.join(process.cwd(), '/origami.json')} following the format defined at: http://origami.ft.com/docs/syntax/origamijson/`;
		}
	}
};
