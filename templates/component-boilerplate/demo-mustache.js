'use strict';

module.exports = (name) => {
	return `<div>
	<div class="${name.original}" data-o-component="${name.original}"></div>
</div>`;
};
