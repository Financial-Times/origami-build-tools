'use strict';

const path = require('path');
const CLIEngine = require('eslint').CLIEngine;
const gitignore = require('parse-gitignore');
const denodeify = require('denodeify');
const deglob = denodeify(require('deglob'));

function eslint () {

	const cli = new CLIEngine({
		baseConfig: false,
		envs: ['browser', 'mocha'],
		configFile: path.join(__dirname, '/../../config/.eslintrc.js'),
		useEslintrc: false,
		ignorePattern: gitignore(path.join(process.cwd(), '/.gitignore'))
	});

	const report = cli.executeOnFiles(cli.resolveFileGlobPatterns(['**/*.js']));
	const formatter = cli.getFormatter('compact');
	const errorReport = CLIEngine.getErrorResults(report.results);
	if (errorReport.length) {
		throw new Error('Failed linting: \n\n' + formatter(errorReport)
			.replace('problems', 'linting errors')
			.replace('problem', 'linting error')
			.replace(new RegExp(process.cwd(), 'gi'), '.')
			.replace(new RegExp(': line ', 'g'), ':')
			.replace(new RegExp(', col ', 'g'), ':')
			.replace(new RegExp(', Error', 'g'), ' Error')
		);
	}
}

module.exports = {
	title: 'Linting Javascript',
	task: eslint,
	skip: () => {
		const opts = {
			useGitIgnore: true,
			usePackageJson: false
		};

		return deglob(['**/*.js'], opts)
			.then(function (files) {
				if (files.length === 0) {
					return 'No Javascript files found.';
				} else {
					return false;
				}
			})
			.catch(() => false);
	}
};
