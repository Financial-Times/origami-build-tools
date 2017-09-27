'use strict';

const Listr = require('listr');
const path = require('path');
const fs = require('fs');
const denodeify = require('denodeify');
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
		skip: () => {
			const configPath = path.join(config.cwd, 'origami.json');
			return readFile(configPath)
				.then(file => {
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
				})
				.catch(() => {
					return `No origami.json file found at ${configPath}`;
				})
		}
	}], {
		renderer: require('../helpers/listr-renderer')
	})
		.run();
};

module.exports.watchable = true;
