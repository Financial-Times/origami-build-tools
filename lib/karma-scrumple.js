"use strict";

const execa = require('execa');
const scrumplePath = require('scrumple');
const path = require('path');

function createPreprocessor(config, logger) {
	const log = logger.create('preprocessor.scrumple');

	return async function preprocess(original, file, done) {
		const originalPath = file.originalPath;
		const location = path.relative(config.basePath, originalPath);

		const scrumpleArguments = [];
		scrumpleArguments.push(`--map-inline --input ${file.originalPath}`);

		const scrumpleCommand = scrumplePath + ' ' + scrumpleArguments.join(' ');
		try {
			log.info('Generating bundle for ./%s', location);
			const {stdout, stderr} = await execa.command(scrumpleCommand, {
				cwd: config.basePath
			});
			if (stderr) {
				log.error('Failed to process ./%s\n\n%s\n', location, stderr);
				done(stderr);
			} else if (stdout) {
				done(undefined, stdout);
			} else {
				log.warn('Nothing was processed for ./%s\n', location);
			}
			done(null, original);
		} catch (error) {
			log.error('Failed to process ./%s\n\n%s\n', location, error.stack);
			done(error, null);
		}
	};
}

module.exports = {
	'preprocessor:scrumple': [
		'factory',
		(factory => {
			factory.$inject = ['config', 'logger'];
			return factory;
		})(createPreprocessor),
	],
};
