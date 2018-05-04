/* eslint-env mocha */
'use strict';

const sinon = require('sinon');
const fileHelpers = require('../../../lib/helpers/files');
const { getBaseKarmaConfig } = require('../../../config/karma.config');
const proclaim = require('proclaim');

describe('base karma config', () => {
	it('includes component scss with a silent mode variable set to false', () => {
		const mockName = 'o-karma-test';
		const mockScss = 'boby:after{content:"hello"}';
		const getModuleNameMock = sinon.stub(fileHelpers, 'getModuleName');
		const readIfExistsMock = sinon.stub(fileHelpers, 'readIfExists');

		getModuleNameMock.returns(new Promise((resolve) => {
			resolve(mockName);
		}));

		readIfExistsMock.returns(new Promise((resolve) => {
			resolve(mockScss);
		}));

		return getBaseKarmaConfig().then(actualConfig => {
			const actualScssConfig = actualConfig.scssPreprocessor.options.data;
			proclaim.equal(
				actualScssConfig,
				`$${mockName}-is-silent: false; ${mockScss}`
			);
			fileHelpers.getModuleName.restore();
			fileHelpers.readIfExists.restore();
		});
	});
});
