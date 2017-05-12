'use strict';

const path = require('path');
const CLIEngine = require('eslint').CLIEngine;
const gitignore = require('parse-gitignore');
const deglob = require('deglob');

function eslint () {

	const cli = new CLIEngine({
		baseConfig: false,
		envs: ['browser', 'mocha'],
		configFile: path.join(__dirname, '/../../config/.eslintrc'),
		useEslintrc: false,
		ignorePattern: gitignore(path.join(process.cwd(), '/.gitignore'))
	});

	const report = cli.executeOnFiles(cli.resolveFileGlobPatterns(['**/*.js']));
	const formatter = cli.getFormatter('compact');
	const errorReport = CLIEngine.getErrorResults(report.results);
	if (errorReport.length) {
		throw new Error('Failed linting: \n\n' + formatter(errorReport).replace('problems', 'linting errors').replace('problem', 'linting error').replace(new RegExp(process.cwd(), 'gi'), '.'));
	}
};

module.exports = {
	title: 'Linting Javascript',
	task: eslint,
	skip: () => {
		return new Promise(resolve => {
			const opts = {
				useGitIgnore: true,
				usePackageJson: false
			};

			deglob(['**/*.js'], opts, function (err, files) {
				if (err) {
					resolve(false);
				} else {
					if (files.length === 0) {
						resolve('No Javascript files found.');
					} else {
						resolve(false);
					}
				}
			});
		});
	}
};
