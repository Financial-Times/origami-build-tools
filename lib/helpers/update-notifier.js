'use strict';

require('colors');

const https = require('https');
const path = require('path');
const Configstore = require('configstore');
const semver = require('semver');
const log = require('./log');
const config = new Configstore('origami-build-tools');
const updateCheckInterval = 1000 * 60 * 60 * 24;

function checkVersion() {
	return new Promise(function(resolve, reject) {
		const req = https.request({
			port: 443,
			method: 'GET',
			host: 'raw.githubusercontent.com',
			path: '/Financial-Times/origami-build-tools/master/package.json'
		}, function(res) {
			let output = '';
			res.setEncoding('utf8');

			res.on('data', function(chunk) {
				output += chunk;
			});

			res.on('end', function() {
				const packageJson = JSON.parse(output);
				resolve(packageJson.version);
			});
		});

		req.on('error', function(err) {
			reject(err);
		});

		req.end();
	});
}

function getCurrentVersion() {
	return require(path.join(__dirname, '/../../package.json')).version;
}

function updateNotifier() {
	if (!config.get('lastUpdateCheck')) {
		config.set('lastUpdateCheck', Date.now());
	}

	if (Date.now() - config.get('lastUpdateCheck') >= updateCheckInterval) {
		checkVersion().then(function(latestVersion) {
			config.set('lastUpdateCheck', Date.now());
			const currentVersion = getCurrentVersion();
			if (semver.lt(currentVersion, latestVersion)) {
				console.log(String('Origami Build Tools update available: ').bold + String(latestVersion).bold.green + ' ' + String('(current: ' + currentVersion + ')').grey);
				console.log(String('Run ').bold + String('npm install -g origami-build-tools').bold.blue + String(' to update').bold);
				console.log(String('If this requires sudo, we recommend configuring npm as explained in our Troubleshoot guide: http://bit.ly/obt-troubleshoot'));
			}
		}, function(error) {
			log.primary('An error occured when trying to get latest version of origami-build-tools:');
			log.secondaryError(error);
		});
	}
}

module.exports = updateNotifier;
