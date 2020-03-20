'use strict';

const process = require('process');
const path = require('path');
const gitignore = require('parse-gitignore');
const lint = require('sass-lint');
const denodeify = require('util').promisify;
const deglob = denodeify(require('deglob'));

const configPath = path.join(__dirname, '/../../config/scss-lint.yml');

function sassLint(config) {
	// TODO: Lint .sass files as well
	const report = lint.lintFiles(path.join(config.cwd, '**/*.scss'), {
		files: {
			ignore: gitignore(path.join(config.cwd, '/.gitignore')).concat([
				'**/bower_components/**',
				'**/node_modules/**',
				'./bower_components/**',
				'./node_modules/**',
				'bower_components/**',
				'node_modules/**'
			])
		}
	}, configPath);
	const results = lint.format(report, {}, configPath);

	if (results) {
		throw new Error('Failed linting: \n\n' + results
			.replace('problems', 'linting errors')
			.replace('problem', 'linting error')
			.replace(new RegExp(config.cwd, 'gi'), '.')
			.replace(new RegExp(': line ', 'g'), ':')
			.replace(new RegExp(', col ', 'g'), ':')
			.replace(new RegExp(', Error', 'g'), ' Error')
		);
	}

}

module.exports = function (cfg) {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	return {
		title: 'Linting Sass',
		task: () => sassLint(config),
		skip: () => {
			const opts = {
				useGitIgnore: true,
				usePackageJson: false,
				cwd: config.cwd
			};

			return deglob(['**/**.scss', '**/**.sass'], opts)
				.then(function (files) {
					if (files.length === 0) {
						return 'No Sass files found.';
					} else {
						return false;
					}
				})
				.catch(() => false);
		}
	};
};
