"use strict";

const process = require("process");
const {
	promises: {readFile},
} = require("fs");
const path = require("path");
const isCI = require("is-ci");
const vfile = require("vfile");
const fs = require('fs-extra');
const remark = require("remark");
const remarkLint = require("remark-lint");
const origamiPreset = require("remark-preset-lint-origami-component");
const report = require("vfile-reporter");

async function origamiJson(config) {
	// Error if there is no readme to verify.
	const readmePath = path.join(config.cwd, "/README.md");
	const hasReadme = await fs.exists(readmePath);
	if (!hasReadme) {
		throw new Error('Components require a README.md with documentation.');
	}

	const contents = await readFile(readmePath, {
		encoding: "utf-8",
	});

	const readme = vfile({
		path: readmePath,
		contents,
	});

	// Get remark config from the component directory,
	// or use the default if it does not exist.
	const remarkPath = path.join(config.cwd, '/.remarkrc.js');
	const hasRemark = await fs.exists(remarkPath);
	// Dynamically require component remark configuration.
	// We allow a dynamic require as we trust the input:
	// https://github.com/Financial-Times/origami-build-tools/issues/881
	// eslint-disable-next-line import/no-dynamic-require
	const remarkConfigFile = hasRemark ? require(remarkPath) : origamiPreset;

	const result = await remark()
		.use(remarkLint)
		.use(remarkConfigFile)
		.process(readme);


	if (result.messages.length) {
		if (isCI) {
			result.messages.forEach(issue => {
				const newLine = "%0A";
				const message = issue.message.replace(/\n/g, newLine);
				const line = issue.line;
				const column = issue.column;
				const code = issue.ruleId;
				const severity = issue.severity === 2 ? "error" : "warning";
				console.log(
					`::${severity} file=README.md,line=${line},col=${column},code=${code},severity=${severity}::${message}`
				);
			});
		} else {
			throw new Error(
				"README.md errors: \n\n" +
					report(result, {
						color: false,
					}).replace(new RegExp(config.cwd, "gi"), ".")
			);
		}
	}
}

module.exports = cfg => {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	return {
		title: "Verifying your component's README.md",
		task: () => origamiJson(config),
	};
};
