'use strict';

const constructPolyfillUrl = require('../helpers/construct-polyfill-url');
const Listr = require('listr');

const karmaTest = function (config, task) {
	return constructPolyfillUrl()
		.then(polyfillUrl => {
			return new Promise((resolve, reject) => {

				const cfg = require('karma').config;
				const path = require('path');

				const karmaConfig = config.browserstack ?
					cfg.parseConfig(path.join(__dirname, '../../config/karma.config.browserstack.js'), {basePath: config.cwd})
					: cfg.parseConfig(path.join(__dirname, '../../config/karma.config.phantom.js'), {basePath: config.cwd});

				const { reporter, errors } = require('../plugins/listr-karma')();

				karmaConfig.files.unshift(polyfillUrl);
				karmaConfig.plugins.unshift(reporter);
				karmaConfig.reporters = ['listr'];

				const Server = require('karma').Server;
				const server = new Server(karmaConfig, exitCode => {
					if (exitCode !== 0) {
						reject(new Error(`Failed Karma tests: ${'\n\n' + errors.join('\n\n')}`));
					} else {
						resolve();
					}
				});

				server.on('browser_start', function (browser) {
					task.title = `Starting tests on ${browser.name}`;
				});

				server.on('browser_register', function (browser) {
					task.title = `Running tests on ${browser.name}`;
				});

				server.on('browser_complete', function (browser) {
					task.title = `Completed tests on ${browser.name}`;
				});

				server.on('browser_error', function (browser, error) {
					task.title = `Error with ${browser.name}`;
					reject(new Error(`Error connecting to ${browser.name}: ${error.toString()}`));
				});

				server.on('browser_register', function (browser) {
					task.title = `Opening ${browser.name}`;
				});


				server.start(karmaConfig);

				task.title = 'Starting Karma server';
			});
		});
};

module.exports = (cfg) => {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	return {
		title: 'Running Karma tests',
		task: (context, task) => {

			if (config.browserstack) {
				task.title = 'Running Karma tests on BrowserStack';
			} else {
				task.title = 'Running Karma tests on PhantomJS';
			}

			return new Listr([
				{
					title: 'Tests starting...',
					task: (context, task) => karmaTest(config, task)
				}
			]);
		}
	};
};
