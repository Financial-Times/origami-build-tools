'use strict';

module.exports = (name) => {
	return `class ${name.titleCase} {

	constructor (${name.camelCase}El, opts) {
		this.${name.camelCase}El = ${name.camelCase}El;
		this.opts = opts || {values: "default"};
	}

	static init (rootEl, opts) {
		if (!rootEl) {
			rootEl = document.body;
		}
		if (!(rootEl instanceof HTMLElement)) {
			rootEl = document.querySelector(rootEl);
		}
		if (rootEl instanceof HTMLElement && rootEl.matches('[data-o-component=${name.original}]')) {
			return new ${name.titleCase}(rootEl, opts);
		}
		return Array.from(rootEl.querySelectorAll('[data-o-component="${name.original}"]'), rootEl => new ${name.titleCase}(rootEl, opts));
	}
}

export default ${name.titleCase};`;
};
