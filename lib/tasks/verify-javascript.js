'use strict';

const process = require('process');
const path = require('path');
const CLIEngine = require('eslint').CLIEngine;
const gitignore = require('parse-gitignore');
const denodeify = require('util').promisify;
const deglob = denodeify(require('deglob'));

async function eslint (config) {
	const hasJS = await projectHasJavaScriptFiles(config);

	if (hasJS) {
		const cli = new CLIEngine({
			baseConfig: false,
			envs: ['browser', 'mocha'],
			configFile: path.join(__dirname, '/../../config/.eslintrc.js'),
			useEslintrc: false,
			ignorePattern: gitignore(path.join(config.cwd, '/.gitignore')),
			cwd: config.cwd
		});

		const report = cli.executeOnFiles(cli.resolveFileGlobPatterns(['**/*.js']));
		const formatter = cli.getFormatter('compact');
		const errorReport = CLIEngine.getErrorResults(report.results);
		if (errorReport.length) {
			throw new Error('Failed linting: \n\n' + formatter(errorReport)
				.replace('problems', 'linting errors')
				.replace('problem', 'linting error')
				.replace(new RegExp(config.cwd, 'gi'), '.')
				.replace(new RegExp(': line ', 'g'), ':')
				.replace(new RegExp(', col ', 'g'), ':')
				.replace(new RegExp(', Error', 'g'), ' Error')
			);
		}
	}
}

function projectHasJavaScriptFiles(config) {
	const opts = {
		useGitIgnore: true,
		usePackageJson: false,
		cwd: config.cwd
	};

	return deglob(['**/*.js'], opts)
		.then(function (files) {
			return files.length > 0;
		});
}

module.exports = function (cfg) {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	return {
		title: 'Linting Javascript',
		task: () => eslint(config),
		skip: async () => {
			const hasJS = await projectHasJavaScriptFiles(config);

			if (!hasJS) {
				return 'No Javascript files found.';
			} else {
				return false;
			}
		}
	};
};
