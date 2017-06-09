'use strict';

const path = require('path');
const gitignore = require('parse-gitignore');
const lint = require('sass-lint');
const denodeify = require('denodeify');
const deglob = denodeify(require('deglob'));

const excludeFiles = gitignore(path.join(process.cwd(), '/.gitignore'));
const configPath = path.join(__dirname, '/../../config/scss-lint.yml');

function sassLint() {
	const report = lint.lintFiles('**/*.scss', { files: { ignore: excludeFiles } }, configPath);
	const results = lint.format(report, {}, configPath);

	if (results) {
		throw new Error('Failed linting: \n\n' + results
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
	title: 'Linting Sass',
	task: sassLint,
	skip: () => {
		const opts = {
			useGitIgnore: true,
			usePackageJson: false
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