'use strict';

module.exports = (name) => {
	return `import ${name.camelCase} from './src/js/${name.original}';

const constructAll = function() {
	${name.camelCase}.init();
	document.removeEventListener('o.DOMContentLoaded', constructAll);
};

document.addEventListener('o.DOMContentLoaded', constructAll);

export default ${name.camelCase};`;
};
