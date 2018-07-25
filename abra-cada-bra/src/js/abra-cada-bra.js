class A {

	constructor (abraCadaBraEl, opts) {
		this.abraCadaBraEl = abraCadaBraEl;
		this.opts = opts || {values: "default"};
	}

	static init (rootEl, opts) {
		if (!rootEl) {
			rootEl = document.body;
		}
		if (!(rootEl instanceof HTMLElement)) {
			rootEl = document.querySelector(rootEl);
		}
		if (rootEl instanceof HTMLElement && rootEl.matches('[data-o-component=abra-cada-bra]')) {
			return new A(rootEl, opts);
		}
		return Array.from(rootEl.querySelectorAll('[data-o-component="abra-cada-bra"]'), rootEl => new A(rootEl, opts));
	}
}

export default A;