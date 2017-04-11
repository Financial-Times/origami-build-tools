const karmaBaseConfig = require('./karma.config');

const customLaunchers = {
	// If browser_version is not set, uses latest stable version

	// Tesing on minimum version for enhanced experience based on
	// https://docs.google.com/document/d/1mByh6sT8zI4XRyPKqWVsC2jUfXHZvhshS5SlHErWjXU

	// Firefox latest
	bs_firefox: {
		base: 'BrowserStack',
		browser: 'firefox',
		os: 'OS X',
		os_version: 'Sierra'
	},

	// Chrome latest
	bs_chrome: {
		base: 'BrowserStack',
		browser: 'chrome',
		os: 'OS X',
		os_version: 'Sierra'
	},

	// Safari 10
	bs_safari: {
		base: 'BrowserStack',
		browser: 'safari',
		os: 'OS X',
		os_version: 'Sierra'
	},

	// IE 11
	bs_ie: {
		base: 'BrowserStack',
		browser: 'ie',
		os: 'Windows',
		os_version: '10'
	},

	// Edge latest
	bs_edge: {
		base: 'BrowserStack',
		browser: 'edge',
		os: 'Windows',
		os_version: '10'
	},

	// iOS 8
	bs_iphone6: {
		base: 'BrowserStack',
		device: 'iPhone 6',
		os: 'ios',
		os_version: '8.3'
	},

	// Android 4.4
	bs_android4_4: {
		base: 'BrowserStack',
		os: 'android',
		device: 'Samsung Galaxy S5',
		os_version: '4.4'
	}
};

const browsers = Object.keys(customLaunchers);

module.exports = function (config) {

	const karmaConfig = Object.assign(karmaBaseConfig, {
		browsers,
		browserStack: {
			startTunnel: true // let BrowserStack connect to our local server
		},
		customLaunchers,
	});

	config.set(karmaConfig);
};
