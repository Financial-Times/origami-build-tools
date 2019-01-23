'use strict';

const fs = require('fs-extra');
const path = require('path');
const denodeify = require('denodeify');
const deglob = denodeify(require('deglob'));

const fileExists = (file) => denodeify(fs.open)(file, 'r').then(() => true).catch(() => false);
const readFile = denodeify(fs.readFile);

function getBuildFolderPath(cwd) {
	cwd = cwd || process.cwd();
	return path.join(cwd, '/build/');
}

function requireIfExists(filePath) {
	return readIfExists(filePath)
		.then(file => {
			return file ? JSON.parse(file) : undefined;
		});
}

function readIfExists(filePath) {
	return fileExists(filePath)
		.then(exists => {
			if (exists) {
				return readFile(filePath, 'utf-8');
			} else {
				return undefined;
			}
		});
}

function getPackageJson(cwd) {
	cwd = cwd || process.cwd();
	return requireIfExists(path.join(cwd, '/package.json'));
}

function packageJsonExists(cwd) {
	return fileExists(path.join(cwd || process.cwd(), '/package.json'));
}

function packageLockJsonExists(cwd) {
	return fileExists(path.join(cwd || process.cwd(), '/package-lock.json'));
}

function getBowerJson(cwd) {
	cwd = cwd || process.cwd();
	return requireIfExists(path.join(cwd, '/bower.json'));
}

function getOrigamiJson(cwd) {
	cwd = cwd || process.cwd();
	return requireIfExists(path.join(cwd, '/origami.json'));
}

function bowerJsonExists(cwd) {
	return fileExists(path.join(cwd || process.cwd(), '/bower.json'));
}

function getMainSassPath(cwd) {
	cwd = cwd || process.cwd();
	const sassMainPath = path.join(cwd, '/main.scss');
	let isInBowerMain = false;
	return getBowerJson(cwd)
		.then(bowerJson => {
			if (bowerJson) {
				if (Array.isArray(bowerJson.main) && bowerJson.main.includes('main.scss')) {
					isInBowerMain = true;
				} else if (typeof bowerJson.main === 'string' && bowerJson.main === 'main.scss') {
					isInBowerMain = true;
				}
			}

			return fileExists(sassMainPath);
		})
		.then(sassExists => {
			if (isInBowerMain && !sassExists) {
				// This should probably throw an error
				// throw new Error('main.scss is listed in bower.json main, but file doesn\'t exist.');
			} else if (!isInBowerMain && sassExists) {
				// throw new Error('main.scss exists but is not listed in bower.json main.');
			}
			if (isInBowerMain && sassExists) {
				return sassMainPath;
			} else {
				return null;
			}
		});
}

function getMainJsPath(cwd) {
	cwd = cwd || process.cwd();
	const jsMainPath = path.join(cwd, '/main.js');
	let isInBowerMain = false;
	return getBowerJson(cwd)
		.then(bowerJson => {
			if (bowerJson) {
				if (Array.isArray(bowerJson.main) && bowerJson.main.includes('main.js')) {
					isInBowerMain = true;
				} else if (typeof bowerJson.main === 'string' && bowerJson.main === 'main.js') {
					isInBowerMain = true;
				}
			}

			return fileExists(jsMainPath);
		})
		.then(jsExists => {
			if (isInBowerMain && !jsExists) {
				// This should probably throw an error
				// throw new Error('main.js is listed in bower.json main, but file doesn\'t exist.');
			} else if (!isInBowerMain && jsExists) {
				// throw new Error('main.js exists but is not listed in bower.json main.');
			}
			if (isInBowerMain && jsExists) {
				return jsMainPath;
			} else {
				return null;
			}
		});
}

function getModuleName(cwd) {
	return getBowerJson(cwd)
		.then(bowerJson => {
			if (bowerJson) {
				return bowerJson.name;
			}
			return '';
		});
}

function getModuleBrands(cwd) {
	return getOrigamiJson(cwd)
		.then(origamiJson => {
			if (origamiJson && origamiJson.brands && Array.isArray(origamiJson.brands)) {
				return origamiJson.brands;
			}
			return [];
		});
}

// List mustache files in a directory, recursing over subdirectories
function getMustacheFilesList(basePath) {
	const opts = {
		useGitIgnore: true,
		usePackageJson: false,
		cwd: basePath
	};

	return deglob(['**/**.mustache'], opts);
}

function getSassFilesList(cwd) {
	const opts = {
		useGitIgnore: true,
		usePackageJson: false,
		cwd: cwd || process.cwd()
	};

	return deglob(['**/**.scss', '**/**.sass'], opts);
}

function getSassTestFiles(cwd) {
	const opts = {
		usePackageJson: false,
		cwd: cwd || process.cwd()
	};

	return deglob([`test/scss/**/**.test.scss`, `test/scss/**.test.scss`], opts);
}

function sassSupportsSilent(files, cwd) {
	let supportsSilent = false;
	return getModuleName(cwd)
		.then(moduleName => {
			if (moduleName) {
				return Promise.all(files.map(file => {
					return readFile(file, {
						encoding: 'utf-8'
					})
						.then(sass => {
							if (sass.includes(moduleName + '-is-silent')) {
								supportsSilent = true;
							}
						});
				}))
					.then(() => {
						return supportsSilent;
					});
			} else {
				throw new Error('Silent mode support can\'t be verified if your module name is not set in your bower.json file.');
			}
		});
}

function getSassIncludePaths (cwd, config = {}) {
	return [cwd].concat([
		...config.sassIncludePaths || [],
		'bower_components',
		'node_modules',
		path.join('node_modules', '@financial-times')
	].map(pathname => path.join(cwd, pathname)));
}

module.exports.readIfExists = readIfExists;
module.exports.getBuildFolderPath = getBuildFolderPath;
module.exports.getMainSassPath = getMainSassPath;
module.exports.getMainJsPath = getMainJsPath;
module.exports.getPackageJson = getPackageJson;
module.exports.packageJsonExists = packageJsonExists;
module.exports.packageLockJsonExists = packageLockJsonExists;
module.exports.getBowerJson = getBowerJson;
module.exports.bowerJsonExists = bowerJsonExists;
module.exports.getModuleName = getModuleName;
module.exports.getSassFilesList = getSassFilesList;
module.exports.sassSupportsSilent = sassSupportsSilent;
module.exports.getMustacheFilesList = getMustacheFilesList;
module.exports.getSassTestFiles = getSassTestFiles;
module.exports.getModuleBrands = getModuleBrands;
module.exports.getSassIncludePaths = getSassIncludePaths;
