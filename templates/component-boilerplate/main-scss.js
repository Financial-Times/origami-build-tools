'use strict';

module.exports = (name) => {
	return `@import 'scss/variables';
@import 'scss/mixins';

@if ($${name.original}-is-silent == false) {
@include ${name.camelCase}();

// Set to silent again to avoid being output twice
$${name.original}-is-silent: true !global;
}`;
};
