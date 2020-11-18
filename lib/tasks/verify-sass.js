'use strict';

const process = require('process');
const path = require('path');
const lint = require('stylelint');
const denodeify = require('util').promisify;
const deglob = denodeify(require('deglob'));
const fs = require('fs-extra');
const isCI = require('is-ci');

async function sassLint(config) {
	const hasScss = await projectHasScssFiles(config);

	if (hasScss) {
		// Get stylelint config from the component directory.
		const stylelintFile = '.stylelintrc.js';
		const stylelintPath = path.join(config.cwd, stylelintFile);
		const hasStylelint = await fs.exists(stylelintPath);
		if (!hasStylelint) {
			throw new Error(`Could not lint Sass. The component is missing lint configuration "${stylelintFile}".`);
		}

		const result = await lint.lint({
			files: [path.join(config.cwd, '**/*.scss')],
			ignorePath: '.gitignore',
			configFile: stylelintPath,
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
