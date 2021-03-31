'use strict';

const process = require('process');
const fs = require('fs');
const path = require('path');
const denodeify = require('util').promisify;
const isCI = require('is-ci');

const fileExists = file => denodeify(fs.open)(file, 'r').then(() => true).catch(() => false);
const readFile = denodeify(fs.readFile);

function packageJson(config) {
	const result = [];

	const packageJsonPath = path.join(config.cwd, '/package.json');
	return fileExists(packageJsonPath)
		.then(exists => {
			if (exists) {
				return readFile(packageJsonPath, 'utf8')
					.then(file => {
						const packageJson = JSON.parse(file);
						if (typeof packageJson.description === 'string') {
							if (packageJson.description.trim().length === 0) {
								result.push('A description property is required. It must be a string which describes the component.');
							}
						} else {
							result.push('A description property is required. It must be a string which describes the component.');
						}
						if (Array.isArray(packageJson.keywords)) {
							if (packageJson.keywords.some(keyword => typeof keyword !== 'string' || keyword.trim().length === 0)) {
								result.push('The keywords property is required. It must be an array. It must contain only strings which relate to the component. It can also be an empty array.');
							}
						} else {
							result.push('The keywords property is required. It must be an array. It must contain only strings which relate to the component. It can also be an empty array.');
						}

						if (result.length > 0) {
							const message = 'Failed linting:\n\n' + result.join('\n') + '\n\nThe package.json file does not conform to the specification at https://origami.ft.com/spec/v2/components/#package-management';
							if (isCI) {
								const newLine = "%0A";
								console.log(`::error file=package.json,line=1,col=1::${message.replace(/\n/g, newLine)}`);
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
		title: 'Verifying your package.json',
		task: () => packageJson(config),
		skip: function () {
			const packageJsonPath = path.join(config.cwd, '/package.json');

			return fileExists(packageJsonPath)
				.then(exists => {
					if (!exists) {
						return `No package.json file found. To make this an origami component, create a file at ${path.join(config.cwd, '/package.json')} following the format defined at: https://origami.ft.com/spec/v2/components/#package-management`;
					}
				});
		}
	};
};
