'use strict';

module.exports = (name) => {
	return `class ${name.titleCase} {
	/**
	 * Class constructor.
	 * @param {HTMLElement} [${name.camelCase}Element] - The component element in the DOM
	 * @param {Object} [options={}] - An options object for configuring the component
	 */
	constructor (${name.camelCase}El, opts) {
		this.${name.camelCase}El = ${name.camelCase}El;
		this.options = Object.assign({}, {

		}, opts || ${name.titleCase}.getDataAttributes(${name.camelCase}Element));
	}

	/**
	 * Get the data attributes from the ${name.titleCase}Element. If the message is being set up
	 * declaratively, this method is used to extract the data attributes from the DOM.
	 * @param {HTMLElement} ${name.camelCase}Element - The component element in the DOM
	 */
	static getDataAttributes (${name.camelCase}Element) {
		if (!(${name.camelCase}Element instanceof HTMLElement)) {
			return {};
		}
		return Object.keys(${name.camelCase}Element.dataset).reduce((options, key) => {

			// Ignore data-o-component
			if (key === 'oComponent') {
				return options;
			}

			// Build a concise key and get the option value
			const shortKey = key.replace(/^${name.camelCase}(\w)(\w+)$/, (m, m1, m2) => m1.toLowerCase() + m2);
			const value = ${name.camelCase}Element.dataset[key];

			// Try parsing the value as JSON, otherwise just set it as a string
			try {
				options[shortKey] = JSON.parse(value.replace(/\'/g, '"'));
			} catch (error) {
				options[shortKey] = value;
			}

			return options;
		}, {});
	}

	/**
	 * Initialise message component.
	 * @param {(HTMLElement|String)} rootElement - The root element to intialise the component in, or a CSS selector for the root element
	 * @param {Object} [options={}] - An options object for configuring the component
	 */
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
