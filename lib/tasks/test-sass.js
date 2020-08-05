"use strict";

const commandLine = require("../helpers/command-line");
const denodeify = require("util").promisify;
const files = require("../helpers/files");
const fs = require("fs");
const path = require("path");
const writeFile = denodeify(fs.writeFile);
const unlink = denodeify(fs.unlink);

const trueTest = function(config, task) {
	const testRunner = path.join(config.cwd, "test/scss/test-runner.js");
	return writeFile(
		testRunner,
		`
		const path = require('path');
		const fs = require('fs');
		const componentBase = path.join(__dirname, '../../');
		const sassFile = path.join(__dirname, 'index.test.scss');
		const sassTrue = require('${require.resolve("sass-true")}');
		const sass = require('${require.resolve("sass")}');
		const getSassIncludePaths = ${files.getSassIncludePaths.toString()};
		const sassData = '$system-code: "origami-build-tools";' + fs.readFileSync(sassFile);
		sassTrue.runSass({
			data: sassData,
			// We use this to silence the sass console output when running "obt test".
			functions: {},
			includePaths: [__dirname].concat(getSassIncludePaths(componentBase, ${JSON.stringify(
		config
	)}))
		}, {
			describe, it, sass
		});
	`
	)
		.then(async () => {
			await commandLine.run(
				"mocha",
				["test/scss/test-runner.js"],
				Object.assign({}, config, {
					localDir: path.join(__dirname, "../../"),
					stdout: false,
					stderr: false
				})
			);
		})
		.catch(e => {
			task.title += "\n    " + e.message;
			throw new Error("true test failed.");
		})
		.finally(() => unlink(testRunner));
};

module.exports = function(cfg) {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	return {
		title: "running true test",
		task: (context, task) => trueTest(config, task),
		skip: function() {
			return files.getSassTestFiles(config.cwd).then(sassTestFiles => {
				if (sassTestFiles.length === 0) {
					return `No sass test files found in ./test/scss`;
				}
			});
		}
	};
};

module.exports.watchable = true;
