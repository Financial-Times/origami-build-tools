'use strict';

const process = require('process');
const path = require('path');
const gitignore = require('parse-gitignore');
const lint = require('stylelint');
const denodeify = require('util').promisify;
const deglob = denodeify(require('deglob'));
const fs = require('fs-extra');

const configPath = path.join(__dirname, '/../../config/.stylelintrc.json');

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
		const result = await lint.lint({
			files: [path.join(config.cwd, '**/*.scss'), ...ignorePatterns],
			configFile: configPath,
			configBasedir: path.join(__dirname, '../../'),
			formatter: "compact"
		});

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
