'use strict';

const files = require('../helpers/files');

function runSilentModeTest(cwd) {
	return silentCompilation(cwd)
		.then(() => nonSilentCompilation(cwd));
}

const silentCompilation = function (cwd) {
	return silentCompilationTest(true, cwd);
};

const nonSilentCompilation = function (cwd) {
	return silentCompilationTest(false, cwd);
};

function silentCompilationTest(silent, cwd) {
	const sass = require('./build-sass');
	const silentSass = require('../plugins/silent-sass');
	const nodeSass = require('node-sass');
	return files.getMainSassPath(cwd)
		.then(mainSassFile => {
			if (mainSassFile) {
				return files.getSassFilesList(cwd)
					.then(sassFiles => {
						return files.sassSupportsSilent(sassFiles, cwd)
							.then(supportsSilent => {
								if (supportsSilent) {
									return files.getBowerJson(cwd)
										.then(bowerJson => {
											const sassVar = '$' + (bowerJson || {}).name + '-is-silent: ' + String(silent) + ';';

											const sassConfig = {
												sassPrefix: sassVar,
												sassIncludePaths: [cwd],
												production: true,
												buildFolder: 'disabled',
												sassFunctions: {
													'@warn': function () {
														return nodeSass.NULL;
													}
												},
												cwd: cwd
											};

											return sass(sassConfig)
												.then(css => {
													css = String(css);
													return silentSass({
														silent: silent
													})(css);
												})
												.catch((error) => {
													if (silent) {
														throw new Error(`When compiling with \`${sassVar}\` styles were output when they should not have been: ${error.message}`);
													} else {
														throw new Error(`When compiling with \`${sassVar}\` no styles were output when they should have been: ${error.message}`);
													}
												});
										});
								}
							});
					});
			}
		});
}


module.exports = function (cfg) {
	const config = cfg || {};
	config.cwd = config.cwd || process.cwd();

	return {
		title: 'Testing SCSS silent styles',
		task: () => runSilentModeTest(config.cwd),
		skip: () => !files.getMainSassPath(config.cwd)
	};
};
