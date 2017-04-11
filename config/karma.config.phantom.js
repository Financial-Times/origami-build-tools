const karmaBaseConfig = require('./karma.config');

module.exports = function (config) {

	const karmaConfig = Object.assign(karmaBaseConfig, {
		browsers: ['PhantomJS'],
	});

	config.set(karmaConfig);
};
