'use strict';

function convertToNewFormat(demosConfig) {
	const demoArray = [];
	let demoConfig;
	for (const demoName in demosConfig) {
		if (Object.prototype.hasOwnProperty.call(demosConfig, demoName)) {
			demoConfig = demosConfig[demoName];
			demoConfig.name = demoName;
			demoArray.push(demoConfig);
		}
	}
	return demoArray;
}

module.exports = {
	convertToNewFormat: convertToNewFormat
};
