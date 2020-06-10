'use strict';

const process = require('process');
const path = require('path');
const ESLint = require('eslint').ESLint;
const gitignore = require('parse-gitignore');
const denodeify = require('util').promisify;
const deglob = denodeify(require('deglob'));
const fs = require('fs-extra');

async function lint (config) {
	const hasJS = await projectHasJavaScriptFiles(config);

	if (hasJS) {
		const gitignorePath = path.join(config.cwd, '/.gitignore');
		const hasGitignore = await fs.exists(gitignorePath);
		const ignorePatterns = hasGitignore ? gitignore(await fs.readFile(gitignorePath)) : ['bower_components/', 'node_modules/'];
		const eslint = new ESLint({
			baseConfig: {
				extends: ["origami-component"],
				env: {
					'browser': true,
					'mocha': true
				},
				ignorePatterns,
			},
			useEslintrc: false,
			cwd: config.cwd
		});

		const results = await eslint.lintFiles(['**/*.js']);
		const formatter = await eslint.loadFormatter('compact');
		const resultText = formatter.format(results);
		if (resultText.length) {
			throw new Error('Failed linting: \n\n' + resultText
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
		cwd: config.cwd,
		ignore: ['node_modules', 'bower_components'	]
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
		task: () => lint(config),
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
