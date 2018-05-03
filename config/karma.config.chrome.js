const { getBaseKarmaConfig } = require('./karma.config');
const constants = require('karma').constants;

module.exports.getChromeKarmaConfig = async function () {
	const karmaBaseConfig = await getBaseKarmaConfig();
	const karmaConfig = Object.assign(
		{},
		karmaBaseConfig,
		{
			browsers: ['ChromeHeadless'],
			logLevel: constants.LOG_DISABLE
		}
	);

	return karmaConfig;
};
