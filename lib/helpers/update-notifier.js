'use strict';

require('colors');

var https = require('https');
var Configstore = require('configstore');
var semver = require('semver');
var log = require('./log');
var config = new Configstore('origami-build-tools');
var updateCheckInterval = 1000 * 60 * 60 * 24;

function checkVersion() {
	return new Promise(function(resolve, reject) {
		var req = https.request({
			port: 443,
			method: 'GET',
			host: 'raw.githubusercontent.com',
			path: '/Financial-Times/origami-build-tools/master/package.json'
		}, function(res) {
			var output = '';
			res.setEncoding('utf8');

			res.on('data', function(chunk) {
				output += chunk;
			});

			res.on('end', function() {
				var packageJson = JSON.parse(output);
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
	return require(__dirname + '/../../package.json').version;
}

function updateNotifier() {
	if (!config.get('lastUpdateCheck')) {
		config.set('lastUpdateCheck', Date.now());
	}

	if (Date.now() - config.get('lastUpdateCheck') >= updateCheckInterval) {
		checkVersion().then(function(latestVersion) {
			config.set('lastUpdateCheck', Date.now());
			var currentVersion = getCurrentVersion();
			if (semver.lt(currentVersion, latestVersion)) {
				console.log(String('Origami Build Tools update available: ').bold + String(latestVersion).bold.green + ' ' + String('(current: ' + currentVersion + ')').grey);
				console.log(String('Run ').bold + String('npm install -g origami-build-tools').bold.blue + String(' to update.').bold);
			}
		}, function(error) {
			log.primary('An error occured when trying to get latest version of origami-build-tools:');
			log.secondaryError(error);
		});
	}
}

module.exports = updateNotifier;
