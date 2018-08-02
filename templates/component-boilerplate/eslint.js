'use strict';

module.exports = () => {
	return `{
	"extends": "eslint-config-origami-components",
	"rules": {
		// Override any settings from the "parent" configuration
		// For example, Next may want to override some rules for their Next components
	}
}`;
};
