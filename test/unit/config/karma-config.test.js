/* eslint-env mocha */
'use strict';

const sinon = require('sinon');
const fileHelpers = require('../../../lib/helpers/files');
const { getBaseKarmaConfig } = require('../../../config/karma.config');
const proclaim = require('proclaim');
const path = require('path');
const process = require('process');

describe('base karma config', () => {
	const mockName = 'o-karma-test';
	const mockScss = 'boby:after{content:"hello"}';

	beforeEach(() => {
		const getModuleNameMock = sinon.stub(fileHelpers, 'getModuleName');
		const readIfExistsMock = sinon.stub(fileHelpers, 'readIfExists');

		getModuleNameMock.returns(new Promise((resolve) => {
			resolve(mockName);
		}));

		readIfExistsMock.returns(new Promise((resolve) => {
			resolve(mockScss);
		}));
	});

	afterEach(() => {
		fileHelpers.getModuleName.restore();
		fileHelpers.readIfExists.restore();
	});

	it('includes component scss with a silent mode variable set to false', () => {
		return getBaseKarmaConfig().then(actualConfig => {
			const actualScssConfig = actualConfig.scssPreprocessor.options.data;
			proclaim.equal(
				actualScssConfig,
				`$system-code: "origami-build-tools";$${mockName}-is-silent: false; ${mockScss}`
			);
		});
	});

	it('includes only bower scss paths by default', () => {
		return getBaseKarmaConfig().then(actualConfig => {
			const actual = actualConfig.scssPreprocessor.options.includePaths;
			const expected = [
				process.cwd(),
				path.resolve(process.cwd(), `bower_components`)
			];
			proclaim.deepEqual(actual, expected);
		});
	});

	it('includes only npm scss paths when "ignoreBower" is true', () => {
		return getBaseKarmaConfig({ ignoreBower: true }).then(actualConfig => {
			const actual = actualConfig.scssPreprocessor.options.includePaths;
			const expected = [
				process.cwd(),
				path.resolve(process.cwd(), `node_modules`),
				path.resolve(process.cwd(), 'node_modules/@financial-times')
			];
			proclaim.deepEqual(actual, expected);
		});
	});
});
