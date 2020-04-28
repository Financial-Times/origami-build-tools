'use strict';

const Listr = require('listr');
const ListrMultilineRenderer = require('listr-multiline-renderer');
const path = require('path');
const fs = require('fs');
const denodeify = require('util').promisify;
const readFile = denodeify(fs.readFile);
const buildDemo = require('./demo-build');

module.exports = function (cfg) {
	cfg = cfg || {};
	const config = cfg.flags || {};
	config.cwd = config.cwd || process.cwd();

	return new Listr([{
		title: 'Compiling Demos',
		task: () => {
			return buildDemo(config);
		},
		skip: async () => {
			const configPath = path.join(config.cwd, 'origami.json');
			try {
				const file = await readFile(configPath);
				let demosConfig;
				try {
					demosConfig = JSON.parse(file);
				} catch (error) {
					return `${configPath} is not valid JSON.`;
				}

				if (!Array.isArray(demosConfig.demos) || demosConfig.demos.length < 1) {
					return 'No demos exist in origami.json file. Reference http://origami.ft.com/docs/syntax/origamijson/ to help configure demos for the component.';
				}

				return false;
			} catch(e) {
				return `No origami.json file found at ${configPath}`;
			}
		}
	}], {
		renderer: ListrMultilineRenderer,
		collapse: false,
		showSubtasks: true,
		concurrent: true
	})
		.run();
};

module.exports.watchable = true;
