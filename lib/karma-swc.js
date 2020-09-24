"use strict";

const execa = require('execa');
const swcPath = require.resolve('@swc/cli/bin/swc');
const path = require('path');

function createPreprocessor(config, logger) {
	const log = logger.create('preprocessor.swc');

	return async function preprocess(original, file, done) {
		const originalPath = file.originalPath;
		const location = path.relative(config.basePath, originalPath);

		const swcArguments = ['--filename', '-', '--no-swcrc'];

		const swcCommand = swcPath + ' ' + swcArguments.join(' ');
		try {
			log.info('Generating bundle for ./%s', location);
			const {stdout, stderr} = await execa.command(swcCommand, {
				cwd: config.basePath,
				input: original
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
	'preprocessor:swc': [
		'factory',
		(factory => {
			factory.$inject = ['config', 'logger'];
			return factory;
		})(createPreprocessor),
	],
};
