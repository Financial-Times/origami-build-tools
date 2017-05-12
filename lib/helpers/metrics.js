'use strict';

if (process.env.DISABLE_OBT_ANALYTICS_REPORTNG === '1') {
	module.exports = function () {
		return undefined;
	};
} else {

	const Graphite = require('graphite');

	const graphiteHost = 'graphite.ft.com';
	const graphitePort = 2003;

	const graphite = Graphite.createClient('plaintext://' + graphiteHost + ':' + graphitePort);

	module.exports = function(data) {
		const metrics = {
			origami: {
				buildtools: data
			}
		};

		graphite.write(metrics, function() {
			graphite.end();
		});
	};
}
