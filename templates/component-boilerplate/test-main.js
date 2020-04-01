'use strict';

module.exports = (name) => {
	return `/* eslint-env mocha */
/* global proclaim sinon */
import * as fixtures from './helpers/fixtures';

import ${name.titleCase} from './../main';

describe("${name.titleCase}", () => {
	it('is defined', () => {
		proclaim.equal(typeof ${name.titleCase}, 'function');
	});

	it('has a static init method', () => {
		proclaim.equal(typeof ${name.titleCase}.init, 'function');
	});

	describe('autoinitialize', () => {
		let initSpy;
		beforeEach(() => {
			initSpy = sinon.spy(${name.titleCase}, 'init');
		});

		afterEach(() => {
			initSpy.restore();
		});

		it("should autoinitialize via o.DOMContentLoaded event", (done) => {
			document.dispatchEvent(new CustomEvent('o.DOMContentLoaded'));
			setTimeout(function(){
				proclaim.equal(initSpy.called, true);
				initSpy.restore();
				done();
			}, 100);
		});
		
		it("should not autoinitialize when the event is not dispached", () => {
			proclaim.equal(initSpy.called, false);
		});
	});

	describe("should create a new", () => {
		beforeEach(() => {
			fixtures.htmlCode();
		});

		afterEach(() => {
			fixtures.reset();
		});

		it("component array when initialized", () => {
			const boilerplate = ${name.titleCase}.init();
			proclaim.equal(boilerplate instanceof Array, true);
			proclaim.equal(boilerplate[0] instanceof ${name.titleCase}, true);
		});

		it("single component when initialized with a root element", () => {
			const boilerplate = ${name.titleCase}.init('#element');
			proclaim.equal(boilerplate instanceof ${name.titleCase}, true);
		});
	});
});`;
};
