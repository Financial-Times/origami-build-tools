'use strict';

const denodeify = require('util').promisify;
const fs = require('fs');
const path = require('path');
const isCI = require('is-ci');

const fileExists = file => denodeify(fs.open)(file, 'r').then(() => true).catch(() => false);

const pa11yTest = async function (config) {
	const pa11y = require('pa11y');
	const src = path.join(config.cwd, '/demos/local/pa11y.html');

	// ignoring the href="#" error
	const ignore = ['WCAG2AA.Principle2.Guideline2_4.2_4_1.G1,G123,G124.NoSuchID'];
	// pa11y demos are for pa11y only and may include multiple versions
	// of a landmark component like o-footer
	ignore.push('landmark-one-main');
	ignore.push('landmark-no-duplicate-contentinfo');
	ignore.push('landmark-unique');
	// disable https://dequeuniversity.com/rules/axe/3.5/region?application=axeAPI
	ignore.push('region');
	// pa11y demos are for pa11y only and do not have a heading
	ignore.push('page-has-heading-one');

	// Run the Pa11y tests
	const results = await pa11y(src, {
		ignore,
		runners: [
			'axe'
		]
	});

	if (results.issues.some(result => result.type === 'error')) {
		// Process and return the results
		require('colors');
		const errors = results.issues.filter(result => result.type === 'error')
			.map(result => '\n' +
				' • Error: ' + result.message.white +
				'\n' +
				('   ├── ' + result.code +
					'\n' +
					'   ├── ' + result.selector.replace(/\s+/g, ' ') +
					'\n' +
					'   └── ' + result.context.replace(/\s+/g, ' ')).grey
			);
		if (isCI) {
			errors.forEach(error => {
				const newLine = "%0A";
				const message = error.replace(/\n/g, newLine);
				console.log(`::error file=demos/src/pa11y.mustache,line=1,col=1::${message}`);
			});
		}
		throw new Error('Accessibility errors were found in demos/src/pa11y.mustache\n' + errors.join('\n') + '\nFailed Pa11y tests');
	}

	return results;
};

module.exports = function (cfg) {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	return {
		title: 'Executing Pa11y',
		task: () => pa11yTest(config),
		skip: function () {
			return fileExists(path.join(config.cwd, '/demos/local/pa11y.html'))
				.then(exists => {
					if (!exists) {
						return `No Pa11y demo found. To run Pa11y against this project, create a file at ${path.join(config.cwd, '/demos/local/pa11y.html')}`;
					}
				});
		}
	};
};
