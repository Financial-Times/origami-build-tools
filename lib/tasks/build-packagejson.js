"use strict";

const { writeFileSync, basename } = require('fs');
const path = require('path');
const files = require('../helpers/files');

module.exports = (cfg = {}) => {
	return Promise.all([files.getBowerJson(), files.getPackageJson(), files.getMainJsPath()])
		.then(([bower, npm = {}, mainJs]) => {
			if (!bower) { return; }

			cfg.cwd = cfg.cwd || process.cwd();

			const { dependencies, devDependencies } = bower;

			const pkg = Object.assign({}, npm);

			// Rewrite version numbers to use Yarn extended Github syntax
			// See: https://yarnpkg.com/en/docs/cli/add#toc-yarn-add-alias
			const newDeps = Object.keys(dependencies).reduce((acc, key) => {
				acc[key] = `github:Financial-Times/${key}#${dependencies[key]}`;
				return acc;
			}, {});

			pkg.name = pkg.name
				|| `@Financial-Times/${bower.name}` // Use the "@Financial-Times" npm scope
				|| `@Financial-Times/${path.basename(cfg.cwd)}`;

			pkg.dependencies = Object.assign({}, npm.dependencies, newDeps);
			pkg.devDependencies = Object.assign({}, npm.devDependencies, devDependencies);
			pkg.scripts = Object.assign({}, npm.scripts, {postinstall: 'obt build'});

			if (cfg.js) {
				if (cfg.buildJs) {
					pkg.main = cfg.buildJs;
				} else {
					pkg.main = npm.main || getMainBasename(mainJs);
				}
			} else {
				pkg.main = getMainBasename(mainJs);
			}

			const { version } = require('../../package.json');
			pkg.devDependencies['origami-build-tools'] = version;

			return writeFileSync(
				path.resolve(cfg.cwd, 'package.json'), JSON.stringify(pkg, null, '  '), 'utf-8');
		})
		.catch(console.error);
};


function getMainBasename(p) {
	try {
		return basename(p);
	} catch (e) {
		return 'build/main.js';
	}
}
