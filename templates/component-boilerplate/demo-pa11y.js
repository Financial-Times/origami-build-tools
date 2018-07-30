'use strict';

module.exports = (name) => {
	return `<div>
	<h1>Basic Demo</h1>
	<div class="${name.original}" data-o-component="${name.original}"></div>
</div>

<div>
	<h1>Basic Demo:hover</h1>
	<div class="${name.original}" data-o-component="${name.original}"></div>
</div>
`;
};
