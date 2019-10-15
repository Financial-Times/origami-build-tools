'use strict';

module.exports = (name) => {
	return `/// Output All ${name.camelCase} Features
@mixin ${name.camelCase}() {
	.${name.original} {
		display: block;
	}
};

/// Provide a component specific error message
///
/// @param {String} $message - The message to insert in the error.
/// @access Private
@mixin _${name.camelCase}($message) {
	@error '*** ${name.camelCase} SCSS error: #{$message} ***';
};
`;
};
