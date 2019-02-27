'use strict';

module.exports = (name) => {
	return `import ${name.plainTitleCase} from './src/js/${name.plainName}';

const constructAll = function () {
	${name.plainTitleCase}.init();
	document.removeEventListener('o.DOMContentLoaded', constructAll);
};

document.addEventListener('o.DOMContentLoaded', constructAll);

export default ${name.plainTitleCase};`;
};
