'use strict';

module.exports = () => {
	return `@import 'true';
@import '../../main';

$_test-environment: true;

@import 'mixins.test';
`;
};
