"use strict";

const process = require("process");
const fs = require("fs");
const path = require("path");
const denodeify = require("util").promisify;
const isCI = require("is-ci");
const vfile = require("vfile");
const remark = require("remark");
const remarkLint = require("remark-lint");
const origamiPreset = require("remark-preset-lint-origami-component");
const report = require("vfile-reporter");

const fileExists = file =>
	denodeify(fs.open)(file, "r")
		.then(() => true)
		.catch(() => false);
const readFile = denodeify(fs.readFile);

async function origamiJson(config) {
	const readmePath = path.join(config.cwd, "/README.md");
	const contents = await readFile(readmePath, {
		encoding: "utf-8",
	});

	const readme = vfile({
		path: readmePath,
		contents,
	});

	const result = await remark()
		.use(remarkLint)
		.use(origamiPreset)
		.process(readme);

	if (result.messages) {
		if (isCI) {
			result.messages.forEach(issue => {
				const newLine = "%0A";
				const message = issue.message.replace(/\n/g, newLine);
				const line = issue.line;
				const column = issue.column;
				const code = issue.ruleId;
				const severity = issue.severity === 2 ? "error" : "warning";
				console.log(
					issue,
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
		skip: function() {
			const origamiJsonPath = path.join(config.cwd, "/origami.json");

			return fileExists(origamiJsonPath).then(exists => {
				if (!exists) {
					return `No README.md found. An Origami component requires a readme. Create ${path.join(
						config.cwd,
						"/README.md"
					)} following the format described at: https://origami.ft.com/spec/v1/components/#readme`;
				}
			});
		},
	};
};
