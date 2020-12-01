'use strict';
/* eslint-env mocha */

const mockery = require('mockery');
const proclaim = require('proclaim');
const sinon = require('sinon');
sinon.assert.expose(proclaim, {
	includeFail: false,
	prefix: ''
});
const process = require('process');

const path = require('path');

const obtPath = process.cwd();
const oTestPath = 'test/unit/fixtures/verify';
const verifyTestPath = path.resolve(obtPath, oTestPath);

describe.only('verify-sass', function () {
	let verify;
	let execaStub;
	let execaOutputNoErrors = `[{"source":"/main.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/demos/src/demo.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_base.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_borders.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_brand.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_compact.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_container.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_lines.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_responsive-flat.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_responsive-overflow.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_responsive-scroll.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_row-headings.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_row-stripes.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_sort.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_variables.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_wrapper.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]}]`;
	let execaOutputOneError = `[{"source":"/main.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":true,"warnings":[{"line":48,"column":2,"rule":"indentation","severity":"error","text":"Expected indentation of 1 tab (indentation)"}]},{"source":"/demos/src/demo.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_base.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_borders.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_brand.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_compact.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_container.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_lines.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_responsive-flat.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_responsive-overflow.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_responsive-scroll.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_row-headings.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_row-stripes.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_sort.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_variables.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]},{"source":"/src/scss/_wrapper.scss","deprecations":[{"text":"'at-rule-blacklist' has been deprecated. Instead use 'at-rule-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/at-rule-blacklist/README.md"},{"text":"'declaration-property-value-blacklist' has been deprecated. Instead use 'declaration-property-value-disallowed-list'.","reference":"https://github.com/stylelint/stylelint/blob/13.7.0/lib/rules/declaration-property-value-blacklist/README.md"}],"invalidOptionWarnings":[],"parseErrors":[],"errored":false,"warnings":[]}]`;

	const stylelintExecaErrorFixture = new Error({
		command: './node_modules/.bin/stylelint **/*.scss --ignore-path=".gitignore" --config=".stylelintrc.js" --formatter="json"',
		exitCode: 0,
		stdout: execaOutputOneError,
		stderr: '',
		all: undefined,
		failed: false,
		timedOut: false,
		isCanceled: false,
		killed: false
	});

	const stylelintExecaPassFixture = new Promise(resolve => resolve({
		command: './node_modules/.bin/stylelint **/*.scss --ignore-path=".gitignore" --config=".stylelintrc.js" --formatter="json"',
		exitCode: 0,
		stdout: execaOutputNoErrors,
		stderr: '',
		all: undefined,
		failed: false,
		timedOut: false,
		isCanceled: false,
		killed: false
	}));

	beforeEach(function() {
		mockery.enable({
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		});
		execaStub = sinon.stub().returns(stylelintExecaPassFixture);
		mockery.registerMock('execa', execaStub);
		mockery.registerMock('is-ci', true);
		process.env.CI = true;
		verify = require('../../../lib/tasks/verify-sass');
		process.chdir(verifyTestPath);
	});

	afterEach(function () {
		mockery.resetCache();
		mockery.deregisterAll();
		mockery.disable();
		process.chdir(obtPath);
	});

	describe('default title', () => {
		it('should be "Linting Sass"', () => {
			proclaim.equal(verify().title, 'Linting Sass');
		});
	});

	describe('skip', () => {
		it('should return true if the file does not exist', () => {
			// there is no scss to test in the js folder
			process.chdir(path.resolve(verifyTestPath, 'src/js'));
			return verify().skip().then(skip => {
				proclaim.ok(skip);
			});
		});

		it('should return a helpful message if the file does not exist', () => {
			// there is no scss to test in the js folder
			process.chdir(path.resolve(verifyTestPath, 'src/js'));
			return verify().skip().then(skip => {
				proclaim.equal(skip, 'No Sass files found.');
			});
		});

		it('should return a falsey value if the file does exist', () => {
			return verify().skip().then(skip => {
				proclaim.notOk(skip);
			});
		});
	});

	describe('task', () => {

		beforeEach(() => {
			mockery.registerMock('is-ci', false);
			process.env.CI = false;
		});

		it('should run stylelint binary', function () {
			execaStub.calledWithExactly('./node_modules/.bin/stylelint', [
				'**/*.scss',
				'--ignore-path=".gitignore"',
				'--config=".stylelintrc.js"',
				'--formatter="json"'
			]);
		});

		it('should error on linting failure, formatted for engineers', async function () {
			execaStub = sinon.stub().rejects(stylelintExecaErrorFixture);
			mockery.registerMock('execa', execaStub);
			await verify().task().then(() => {
				throw new Error('Did not throw an error.');
			}).catch(() => {
				// Error thrown as expected.
			});
		});

		describe('running in CI', () => {

			beforeEach(() => {
				mockery.registerMock('is-ci', true);
				process.env.CI = true;
			});

			it('should log linting failures formatted for Github', async function () {
				execaStub = sinon.stub().rejects(stylelintExecaErrorFixture);
				mockery.registerMock('execa', execaStub);
				const expectation = sinon.mock(console).expects('log').withArgs(`::error file=`);
				await verify().task();
				expectation.verify();
			});
		});
	});
});
