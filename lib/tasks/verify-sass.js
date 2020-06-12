'use strict';

const process = require('process');
const path = require('path');
const gitignore = require('parse-gitignore');
const lint = require('stylelint');
const denodeify = require('util').promisify;
const deglob = denodeify(require('deglob'));
const fs = require('fs-extra');
const isCI = require('is-ci');

const defaultStylelintPath = path.join(__dirname, '/../../config/.stylelintrc.json');

async function sassLint(config) {
	const hasScss = await projectHasScssFiles(config);

	if (hasScss) {
		const gitignorePath = path.join(config.cwd, '/.gitignore');
		const hasGitignore = await fs.exists(gitignorePath);
		const gitIgnorePatterns = hasGitignore ? gitignore(await fs.readFile(gitignorePath)).filter(a => !a.startsWith('!')).map(a => `!${a}`) : [];
		const ignorePatterns = [
			'!**/bower_components/**',
			'!**/node_modules/**',
			'!./bower_components/**',
			'!./node_modules/**',
			'!bower_components/**',
			'!node_modules/**'
		].concat(gitIgnorePatterns);

		// Get stylelint config from the component directory,
		// or use the default if it does not exist.
		const stylelintPath = path.join(config.cwd, '/.stylelintrc.js');
		const hasStylelint = await fs.exists(stylelintPath);
		const configPath = hasStylelint ? stylelintPath : defaultStylelintPath;

		const result = await lint.lint({
			files: [path.join(config.cwd, '**/*.scss'), ...ignorePatterns],
			configFile: configPath,
			configBasedir: path.join(__dirname, '../../'),
			formatter: "compact"
		});

		if (isCI) {
			const errorResults = result.results.filter(result => result.errored);
			errorResults.forEach(result => {
				const file = result.source.replace(config.cwd, '');
				result.warnings.forEach(issue => {
					const newLine = "%0A";
					const message = issue.text.replace(/\n/g, newLine);
					const line = issue.line;
					const column = issue.column;
					const code = issue.rule;
					const severity = issue.severity;
					console.log(`::error file=${file},line=${line},col=${column},code=${code},severity=${severity}::${message}`);
				});
			});
		}

		if (result.errored) {
			throw new Error('Failed linting: \n\n' + result.output
				.replace(new RegExp(config.cwd, 'gi'), '.')
				.replace(new RegExp(': line ', 'g'), ':')
				.replace(new RegExp(', col ', 'g'), ':')
				.replace(new RegExp(', error', 'g'), ' Error')
				.replace(new RegExp(', warning', 'g'), ' Warning')
				+ '\n\n' + result.output.split('\n').length + ' Linting issues'
			);
		}

	}
}

function projectHasScssFiles(config) {
	const opts = {
		useGitIgnore: true,
		usePackageJson: false,
		cwd: config.cwd,
		ignore: ['node_modules', 'bower_components'	]
	};

	return deglob(['**/*.scss'], opts)
		.then(function (files) {
			return files.length > 0;
		});
}

module.exports = function (cfg) {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	return {
		title: 'Linting Sass',
		task: () => sassLint(config),
		skip: async () => {
			const hasScss = await projectHasScssFiles(config);

			if (!hasScss) {
				return 'No Sass files found.';
			} else {
				return false;
			}
		}
	};
};
