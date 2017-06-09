'use strict';

const files = require('../helpers/files');

function runSilentModeTest() {
	return silentCompilation()
		.then(() => nonSilentCompilation());
}

const silentCompilation = function () {
	return silentCompilationTest(true);
};

const nonSilentCompilation = function () {
	return silentCompilationTest(false);
};

function silentCompilationTest(silent) {
	const sass = require('./build-sass');
	const silentSass = require('../plugins/silent-sass');
	const nodeSass = require('node-sass');
	return files.getMainSassPath()
		.then(mainSassFile => {
			if (mainSassFile) {
				return files.getSassFilesList()
					.then(sassFiles => {
						return files.sassSupportsSilent(sassFiles)
							.then(supportsSilent => {
								if (supportsSilent) {
									return files.getBowerJson()
										.then(bowerJson => {
											const sassVar = '$' + (bowerJson || {}).name + '-is-silent: ' + String(silent) + ';';

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
												.then(css => {
													css = String(css);
													return silentSass({
														silent: silent
													})(css).catch(() => {
														if (silent) {
															throw new Error(`When compiling with \`${sassVar}\` styles were output when they should not have been`);
														} else {
															throw new Error(`When compiling with \`${sassVar}\` no styles were output when the should have been`);
														}
													});
												});
										});
								}
							});
					});
			}
		});
}


module.exports = {
	title: 'Testing SCSS silent styles',
	task: () => runSilentModeTest(),
	skip: () => !files.getMainSassPath()
};
