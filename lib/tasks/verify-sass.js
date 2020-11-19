'use strict';

const process = require('process');
const path = require('path');
const denodeify = require('util').promisify;
const deglob = denodeify(require('deglob'));
const fs = require('fs-extra');
const isCI = require('is-ci');
const execa = require('execa');

const fileExists = file => denodeify(fs.open)(file, 'r').then(() => true).catch(() => false);
async function sassLint(config) {
	const hasScss = await projectHasScssFiles(config);

	if (hasScss) {
		let stylelintOutput;
		let lintError = false;
		try {
			const result = await execa('npx', [
				'stylelint',
				'**/*.scss',
				'--ignore-path=".gitignore"',
				'--config=".stylelintrc.js"',
				'--formatter="json"'
			]);
			stylelintOutput = result.stdout;
		} catch (error) {
			if (error.exitCode !== 2) {
				throw new Error('stylelint failed to lint Sass:\n' + error.message);
			}
			lintError = true;
			stylelintOutput = error.stdout;
		}

		const result = JSON.parse(stylelintOutput);
		const parsedResults = result
			.filter(result => result.warnings)
			.flatMap(result => {
				return result.warnings.map(issue => {
					return {
						file: result.source.replace(config.cwd, ''),
						message: issue.text,
						line: issue.line,
						column: issue.column,
						code: issue.rule,
						severity: issue.severity
					};
				});
			});

		if (isCI) {
			parsedResults.forEach(result => {
				console.log(`::error file=${result.file},line=${result.line},` +
				`col=${result.column},code=${result.code},` +
					`severity=${result.severity}::${result.message.replace(/\n/g, '%0A')}`);
			});
		}

		const message = parsedResults.reduce((message, result) => {
			return message + `.${result.file}:${result.line}:${result.column} `
				+ `${result.severity} - ${result.message}\n`;
		}, '');

		if (lintError) {
			throw new Error('Failed linting: \n\n' + message);
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
			}
			const stylelintConfigPath = path.join(config.cwd, '.stylelintrc.js');
			const exists = await fileExists(stylelintConfigPath);
			if (!exists) {
				return `No .stylelintrc.js file found. To enable Sass linting create a file at ${path.join(config.cwd, '/.stylelintrc.js')}. Something like ${'`module.exports = { "extends": "stylelint-config-origami-component" };`'}`;
			}
		}
	};
};
