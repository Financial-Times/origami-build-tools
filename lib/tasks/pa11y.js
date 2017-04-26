'use strict';

const denodeify = require('denodeify');
const fs = require('fs');
const path = require('path');

const pa11yTest = function () {
	const pa11y = require('pa11y');
	const src = 'file://' + path.join(process.cwd(), '/demos/local/pa11y.html');
	// ignoring warnings, notices and the href="#" error
	const defaultIgnore = ['WCAG2AA.Principle2.Guideline2_4.2_4_1.G1,G123,G124.NoSuchID', 'warning', 'notice'];
	const ignore = defaultIgnore;
	const test = pa11y({
		ignore: ignore
	});

	const pa11yTestRun = denodeify(test.run.bind(test));

	return pa11yTestRun(src)
		.then(results => {
			require('colors');
			const errors = results.filter(result => result.type === 'error')
				.map(result => '\n' +
					(' • Error: ') + result.message.white +
					'\n' +
					('   ├── ' + result.code +
						'\n' +
						'   ├── ' + result.selector.replace(/\s+/g, ' ') +
						'\n' +
						'   └── ' + result.context.replace(/\s+/g, ' ')).grey
				);

			if (results.some(result => result.type === 'error')) {
				throw new Error(errors.join('\n') + '\nFailed Pa11y tests');
			}

			return results;
		});
};

module.exports = {
	title: 'Executing Pa11y',
	task: pa11yTest,
	skip: () => {
		if (!fs.existsSync(path.join(process.cwd(), '/demos/local/pa11y.html'))) {
			return `No Pa11y demo found. To run Pa11y against this project, create a file at ${path.join(process.cwd(), '/demos/local/pa11y.html')}`;
		}
	}
};
