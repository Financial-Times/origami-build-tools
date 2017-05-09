'use strict';

const files = require('../helpers/files');

function runSilentModeTest () {
	return silentCompilation()
		.then(() => nonSilentCompilation());
}

const silentCompilation = function() {
	return silentCompilationTest(true);
};

const nonSilentCompilation = function() {
	return silentCompilationTest(false);
};

function silentCompilationTest(silent) {
	const sass = require('./build').sass;
	const silentSass = require('../plugins/silent-sass');
	const nodeSass = require('node-sass');

	return new Promise(function (resolve, reject) {
		const mainSassFile = files.getMainSassPath();
		if (mainSassFile) {
			files.getSassFilesList()
				.then(files.sassSupportsSilent)
				.then(function(supportsSilent) {
					if (supportsSilent) {
						const sassVar = '$' + files.getBowerJson().name + '-is-silent: ' + silent + ';';

						const sassConfig = {
							sassPrefix: sassVar,
							sassIncludePaths: ['.'],
							env: 'production',
							buildFolder: 'disabled',
							sassFunctions: {
								'@warn': function () {
									return nodeSass.NULL;
								}
							}
						};

						return sass(sassConfig)
							.pipe(silentSass({silent: silent}))
							.on('error', () => {
								if (silent) {
									reject(new Error(`When compiling with \`${sassVar}\` styles were output when they should not have been`));
								} else {
									reject(new Error(`When compiling with \`${sassVar}\` no styles were output when the should have been`));
								}
							})
							.on('end', function() {
								resolve(true);
							});
					} else {
						resolve();
					}
				}, function(err) {
					reject(err);
				});
		} else {
			resolve();
		}
	});
}


module.exports = {
	title: 'Testing SCSS silent styles',
	task: () => runSilentModeTest(),
	skip: () => !files.getMainSassPath()
};
