class OComponentBoilerplate {
	/**
	 * Class constructor.
	 * @param {HTMLElement} [oComponentBoilerplateElement] - The component element in the DOM
	 * @param {Object} [options={}] - An options object for configuring the component
	 */
	constructor (oComponentBoilerplateEl, opts) {
		this.oComponentBoilerplateEl = oComponentBoilerplateEl;
		this.options = Object.assign({}, {

		}, opts || OComponentBoilerplate.getDataAttributes(oComponentBoilerplateElement));
	}

	/**
	 * Get the data attributes from the OComponentBoilerplateElement. If the message is being set up
	 * declaratively, this method is used to extract the data attributes from the DOM.
	 * @param {HTMLElement} oComponentBoilerplateElement - The component element in the DOM
	 */
	static getDataAttributes (oComponentBoilerplateElement) {
		if (!(oComponentBoilerplateElement instanceof HTMLElement)) {
			return {};
		}
		return Object.keys(oComponentBoilerplateElement.dataset).reduce((options, key) => {

			// Ignore data-o-component
			if (key === 'oComponent') {
				return options;
			}

			// Build a concise key and get the option value
			const shortKey = key.replace(/^oComponentBoilerplate(w)(w+)$/, (m, m1, m2) => m1.toLowerCase() + m2);
			const value = oComponentBoilerplateElement.dataset[key];

			// Try parsing the value as JSON, otherwise just set it as a string
			try {
				options[shortKey] = JSON.parse(value.replace(/'/g, '"'));
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
		if (rootEl instanceof HTMLElement && rootEl.matches('[data-o-component=o-component-boilerplate]')) {
			return new OComponentBoilerplate(rootEl, opts);
		}
		return Array.from(rootEl.querySelectorAll('[data-o-component="o-component-boilerplate"]'), rootEl => new OComponentBoilerplate(rootEl, opts));
	}
}

export default OComponentBoilerplate;
