'use strict';

module.exports = (name) => {
	return `class ${name.plainTitleCase} {
	/**
	 * Class constructor.
	 * @param {HTMLElement} [${name.camelCase}El] - The component element in the DOM
	 * @param {Object} [opts={}] - An options object for configuring the component
	 */
	constructor (${name.camelCase}El, opts) {
		this.${name.camelCase}El = ${name.camelCase}El;
		this.options = Object.assign({}, {

		}, opts || ${name.plainTitleCase}.getDataAttributes(${name.camelCase}El));
	}

	/**
	 * Get the data attributes from the ${name.plainTitleCase}Element. If the component is being set up
	 * declaratively, this method is used to extract the data attributes from the DOM.
	 * @param {HTMLElement} ${name.camelCase}El - The component element in the DOM
	 * @returns {Object} - Data attributes as an object
	 */
	static getDataAttributes (${name.camelCase}El) {
		if (!(${name.camelCase}El instanceof HTMLElement)) {
			return {};
		}
		return Object.keys(${name.camelCase}El.dataset).reduce((options, key) => {

			// Ignore data-o-component
			if (key === 'oComponent') {
				return options;
			}

			// Build a concise key and get the option value
			const shortKey = key.replace(/^${name.camelCase}(\\w)(\\w+)$/, (m, m1, m2) => m1.toLowerCase() + m2);
			const value = ${name.camelCase}El.dataset[key];

			// Try parsing the value as JSON, otherwise just set it as a string
			try {
				options[shortKey] = JSON.parse(value.replace(/\\'/g, '"'));
			} catch (error) {
				options[shortKey] = value;
			}

			return options;
		}, {});
	}

	/**
	 * Initialise the component.
	 * @param {(HTMLElement|String)} rootElement - The root element to intialise the component in, or a CSS selector for the root element
	 * @param {Object} [opts={}] - An options object for configuring the component
	 * @returns {(${name.plainTitleCase}|Array<${name.plainTitleCase}>)} - ${name.plainTitleCase} instance(s)
	 */
	static init (rootEl, opts) {
		if (!rootEl) {
			rootEl = document.body;
		}
		if (!(rootEl instanceof HTMLElement)) {
			rootEl = document.querySelector(rootEl);
		}
		if (rootEl instanceof HTMLElement && rootEl.matches('[data-o-component=${name.original}]')) {
			return new ${name.plainTitleCase}(rootEl, opts);
		}
		return Array.from(rootEl.querySelectorAll('[data-o-component="${name.original}"]'), rootEl => new ${name.plainTitleCase}(rootEl, opts));
	}
}

export default ${name.plainTitleCase};`;
};
