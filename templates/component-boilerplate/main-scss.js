'use strict';

module.exports = (name) => {
	return `@import 'src/scss/variables';
@import 'src/scss/functions';
@import 'src/scss/mixins';

@if ($${name.original}-is-silent == false) {
	@include ${name.camelCase}();

	// Set to silent again to avoid being output twice
	$${name.original}-is-silent: true !global;
}
`;
};
