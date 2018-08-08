'use strict';

module.exports = (name) => {
	return `$${name.original}-is-silent: false;
@import '../../main';
`;
};
