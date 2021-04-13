'use strict';

const process = require('process');
const fs = require('fs');
const path = require('path');
const denodeify = require('util').promisify;
const isCI = require('is-ci');
const validateNpmPackageName = require('validate-npm-package-name');

const fileExists = file => denodeify(fs.open)(file, 'r').then(() => true).catch(() => false);
const readFile = denodeify(fs.readFile);

/**
 * Checks whether description conforms to the origami package.json description specification.
 * @param {any} description The value to check
 * @returns {Boolean} Whether `description` conforms to the origami package.json description specification.
 */
function validDescription(description) {
	if (typeof description === 'string' && description.trim().length > 0) {
		return true;
	} else {
		return false;
	}
}

/**
 * Checks whether keywords conforms to the origami package.json keywords specification.
 * @param {any} keywords The value to check
 * @returns {Boolean} Whether `keywords` conforms to the origami package.json keywords specification.
 */
function validKeywords(keywords) {
	if (Array.isArray(keywords)) {
		const valid = keywords.every(keyword => {
			return typeof keyword === 'string' && keyword.trim().length > 0;
		});
		return valid;
	} else {
		return false;
	}
}

/**
 * Checks whether browser conforms to the origami package.json browser specification.
 * @param {any} manifest The manifest to check
 * @param {string} workingDirectory The directory which contains the component to check
 * @returns {string|void} If valid, returns undefined, otherwise returns a string which explains why it is not valid
 */
function validJavaScriptEntryPoint(manifest, workingDirectory) {
	const mainJavaScriptFileExists = fs.existsSync(path.join(workingDirectory, '/main.js'));
	if (mainJavaScriptFileExists) {
		if (typeof manifest.browser === 'string' && manifest.browser === 'main.js') {
			// The file `main.js` exists and package.json.browser is set to `"main.js"`
			return undefined;
		} else {
			// The file `main.js` exists and package.json.browser is not set to `"main.js"`
			return 'Because the file `main.js` exists, the `browser` property is required. It must have the value `"main.js"`.';
		}
	} else {
		if (Object.hasOwnProperty.call(manifest, 'browser')) {
			// The file `main.js` not exist and package.json.browser does exist
			return 'Because the file `main.js` does not exist, the `browser` property must not be set.';
		} else {
			// The file `main.js` does not exists and package.json.browser does not exist
			return undefined;
		}
	}
}

/**
 * Checks an npm component name conforms to the origami package.json specification.
 * @param {String} name An npm component name.
 * @returns {Boolean} Whether the name parameter is valid according to origami package.json specification.
 */
function validName(name) {
	if (typeof name === 'string' && name.startsWith('@financial-times/') && isValidNpmName(name)) {
		return true;
	} else {
		return false;
	}
}

/**
 * Checks an npm component name conforms to the npmjs package.json specification.
 * @param {String} name An npm component name.
 * @returns {Boolean} Whether the name parameter is valid according to npmjs package.json specification.
 */
function isValidNpmName(name) {
	return validateNpmPackageName(name).validForNewPackages;
}

async function isOrigamiComponent(workingDirectory) {
	const origamiJsonPath = path.join(workingDirectory, '/origami.json');
	const origamiJsonExists = await fileExists(origamiJsonPath);
	if (origamiJsonExists) {
		const origamiJson = JSON.parse(await readFile(origamiJsonPath, 'utf8'));
		if (origamiJson.origamiType === 'component' || origamiJson.origamiType === 'module') {
			return true;
		}
	}

	return false;
}

async function packageJson(config) {
	const result = [];
	const packageJsonPath = path.join(config.cwd, '/package.json');
	const packageJsonExists = await fileExists(packageJsonPath);

	if (packageJsonExists) {
		const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
		if (!validDescription(packageJson.description)) {
			result.push('A description property is required. It must be a string which describes the component.');
		}
		if (!validKeywords(packageJson.keywords)) {
			result.push('The keywords property is required. It must be an array. It must contain only strings which relate to the component. It can also be an empty array.');
		}
		if (!validName(packageJson.name) && await isOrigamiComponent(config.cwd)) {
			result.push('The name property is required. It must be within the `@financial-times` namespace and conform to the npmjs specification at https://docs.npmjs.com/cli/v7/configuring-npm/package-json#name.');
		}

		const invalidExplanation = validJavaScriptEntryPoint(packageJson, config.cwd);
		if (invalidExplanation) {
			result.push(invalidExplanation);
		}

		if (result.length > 0) {
			const message = 'Failed linting:\n\n' + result.join('\n') + '\n\nThe package.json file does not conform to the specification at https://origami.ft.com/spec/v2/components/#package-management';
			if (isCI) {
				const newLine = "%0A";
				console.log(`::error file=package.json,line=1,col=1::${message.replace(/\n/g, newLine)}`);
			}
			const e = new Error(message);
			e.stack = '';
			throw e;
		} else {
			return result;
		}
	}
}

module.exports = cfg => {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	return {
		title: 'Verifying your package.json',
		task: () => packageJson(config),
		skip: function () {
			const packageJsonPath = path.join(config.cwd, '/package.json');

			return fileExists(packageJsonPath)
				.then(exists => {
					if (!exists) {
						return `No package.json file found. To make this an origami component, create a file at ${path.join(config.cwd, '/package.json')} following the format defined at: https://origami.ft.com/spec/v2/components/#package-management`;
					}
				});
		}
	};
};
