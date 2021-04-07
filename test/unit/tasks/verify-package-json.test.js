/* eslint-env mocha */
'use strict';

const mockery = require('mockery');
const proclaim = require('proclaim');
const sinon = require('sinon');
sinon.assert.expose(proclaim, {
	includeFail: false,
	prefix: ''
});
const process = require('process');
const fs = require('fs-extra');
const path = require('path');

const obtPath = process.cwd();
const oTestPath = 'test/unit/fixtures/o-test';
const pathSuffix = '-verify';
const verifyTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

describe('verify-package-json', function () {
	let verifyPackageJson;
	const originalConsole = global.console;
	let console;
	beforeEach(function() {
		mockery.enable({
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		});
		console = {
			log: sinon.stub(),
			warn: sinon.stub(),
			error: sinon.stub()
		};
		mockery.registerMock('is-ci', true);
		process.env.CI = true;
		global.console = console;
		verifyPackageJson = require('../../../lib/tasks/verify-package-json');
		fs.copySync(path.resolve(obtPath, oTestPath), verifyTestPath);
		process.chdir(verifyTestPath);
		fs.writeFileSync('src/scss/verify.scss', '$color: #ccc;\n\np {\n  color: $color!important ;\n}\n', 'utf8');
		fs.writeFileSync('src/js/verify.js', 'const test = \'We live in financial times\';\n');
	});

	afterEach(function () {
		global.console = originalConsole;
		mockery.resetCache();
		mockery.deregisterAll();
		mockery.disable();
		process.chdir(obtPath);
		fs.removeSync(path.resolve(obtPath, verifyTestPath));
	});

	describe('default title', () => {
		it('should be "Verifying your package.json"', () => {
			proclaim.equal(verifyPackageJson().title, 'Verifying your package.json');
		});
	});

	describe('skip', () => {
		it('should return true if the file does not exist', () => {
			fs.removeSync(path.join(process.cwd(), '/package.json'));
			proclaim.ok(verifyPackageJson().skip());
		});

		it('should return a helpful message if the file does not exist', function() {
			fs.removeSync(path.join(process.cwd(), '/package.json'));
			return verifyPackageJson().skip()
				.then(skipped => {
					proclaim.equal(skipped, `No package.json file found. To make this an origami component, create a file at ${path.join(process.cwd(), '/package.json')} following the format defined at: https://origami.ft.com/spec/v2/components/#package-management`);
				});
		});

		it('should return a falsey value if the file does exist', function () {
			return verifyPackageJson().skip()
				.then(skipped => {
					proclaim.notOk(skipped);
				});
		});
	});

	describe('task', function () {
		it('should run package.json check successfully', function () {
			return verifyPackageJson().task().
				then(function (verifiedpackageJson) {
					proclaim.equal(verifiedpackageJson.length, 0);
				});
		});

		it('should not write to the output a github annotation if package.json has no issues', async () => {
			// there is no js in the scss folder to verify
			process.chdir('./src/scss');
			await verifyPackageJson().task();
			proclaim.notCalled(console.log);
		});

		it('should fail with an empty package.json', function () {
			fs.writeFileSync('package.json', JSON.stringify({}), 'utf8');

			return verifyPackageJson().task()
				.catch(function (verifiedpackageJson) {
					proclaim.equal(
						verifiedpackageJson.message,
						'Failed linting:\n\n' +
						'A description property is required. It must be a string which describes the component.\n' +
						'The keywords property is required. It must be an array. It must contain only strings which relate to the component. It can also be an empty array.\n\n' +
						'The package.json file does not conform to the specification at https://origami.ft.com/spec/v2/components/#package-management'
					);
				});
		});

		it('should write to the output a github annotation if empty package.json', async function() {
			try {
				fs.writeFileSync('package.json', JSON.stringify({}), 'utf8');
				await verifyPackageJson().task();
			} catch (e) {
				proclaim.ok(e, `Unexpected error: ${e.message}`);
				proclaim.calledOnce(console.log);
				proclaim.calledWithExactly(
					console.log,
					`::error file=package.json,line=1,col=1::Failed linting:%0A%0AA description property is required. It must be a string which describes the component.%0AThe keywords property is required. It must be an array. It must contain only strings which relate to the component. It can also be an empty array.%0A%0AThe package.json file does not conform to the specification at https://origami.ft.com/spec/v2/components/#package-management`
				);
			}
		});

		it('should fail if missing description property', function () {
			const packageJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
			delete packageJSON.description;
			fs.writeFileSync('package.json', JSON.stringify(packageJSON), 'utf8');

			return verifyPackageJson().task()
				.catch(function (verifiedpackageJson) {
					proclaim.equal(
						verifiedpackageJson.message,
						'Failed linting:\n\n' +
						'A description property is required. It must be a string which describes the component.\n\n' +
						'The package.json file does not conform to the specification at https://origami.ft.com/spec/v2/components/#package-management'
					);
					proclaim.calledOnce(console.log);
					proclaim.calledWithExactly(
						console.log,
						`::error file=package.json,line=1,col=1::Failed linting:%0A%0AA description property is required. It must be a string which describes the component.%0A%0AThe package.json file does not conform to the specification at https://origami.ft.com/spec/v2/components/#package-management`
					);
				});
		});

		it('should fail if description property is an empty string', function () {
			const packageJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
			packageJSON.description = '';
			fs.writeFileSync('package.json', JSON.stringify(packageJSON), 'utf8');

			return verifyPackageJson().task()
				.catch(function (verifiedpackageJson) {
					proclaim.equal(
						verifiedpackageJson.message,
						'Failed linting:\n\n' +
						'A description property is required. It must be a string which describes the component.\n\n' +
						'The package.json file does not conform to the specification at https://origami.ft.com/spec/v2/components/#package-management'
					);
					proclaim.calledOnce(console.log);
					proclaim.calledWithExactly(
						console.log,
						`::error file=package.json,line=1,col=1::Failed linting:%0A%0AA description property is required. It must be a string which describes the component.%0A%0AThe package.json file does not conform to the specification at https://origami.ft.com/spec/v2/components/#package-management`
					);
				});
		});

		it('should fail if description property is a string containing only spaces', function () {
			const packageJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
			packageJSON.description = '      ';
			fs.writeFileSync('package.json', JSON.stringify(packageJSON), 'utf8');

			return verifyPackageJson().task()
				.catch(function (verifiedpackageJson) {
					proclaim.equal(
						verifiedpackageJson.message,
						'Failed linting:\n\n' +
						'A description property is required. It must be a string which describes the component.\n\n' +
						'The package.json file does not conform to the specification at https://origami.ft.com/spec/v2/components/#package-management'
					);
					proclaim.calledOnce(console.log);
					proclaim.calledWithExactly(
						console.log,
						`::error file=package.json,line=1,col=1::Failed linting:%0A%0AA description property is required. It must be a string which describes the component.%0A%0AThe package.json file does not conform to the specification at https://origami.ft.com/spec/v2/components/#package-management`
					);
				});
		});

		it('should fail if missing keywords property', function () {
			const packageJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
			delete packageJSON.keywords;
			fs.writeFileSync('package.json', JSON.stringify(packageJSON), 'utf8');

			return verifyPackageJson().task()
				.catch(function (verifiedpackageJson) {
					proclaim.equal(
						verifiedpackageJson.message,
						'Failed linting:\n\n' +
						'The keywords property is required. It must be an array. It must contain only strings which relate to the component. It can also be an empty array.\n\n' +
						'The package.json file does not conform to the specification at https://origami.ft.com/spec/v2/components/#package-management'
					);
					proclaim.calledOnce(console.log);
					proclaim.calledWithExactly(
						console.log,
						`::error file=package.json,line=1,col=1::Failed linting:%0A%0AThe keywords property is required. It must be an array. It must contain only strings which relate to the component. It can also be an empty array.%0A%0AThe package.json file does not conform to the specification at https://origami.ft.com/spec/v2/components/#package-management`
					);
				});
		});

		it('should fail if keywords property contains an empty string', function () {
			const packageJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
			packageJSON.keywords = [''];
			fs.writeFileSync('package.json', JSON.stringify(packageJSON), 'utf8');

			return verifyPackageJson().task()
				.catch(function (verifiedpackageJson) {
					proclaim.equal(
						verifiedpackageJson.message,
						'Failed linting:\n\n' +
						'The keywords property is required. It must be an array. It must contain only strings which relate to the component. It can also be an empty array.\n\n' +
						'The package.json file does not conform to the specification at https://origami.ft.com/spec/v2/components/#package-management'
					);
					proclaim.calledOnce(console.log);
					proclaim.calledWithExactly(
						console.log,
						`::error file=package.json,line=1,col=1::Failed linting:%0A%0AThe keywords property is required. It must be an array. It must contain only strings which relate to the component. It can also be an empty array.%0A%0AThe package.json file does not conform to the specification at https://origami.ft.com/spec/v2/components/#package-management`
					);
				});
		});

		it('should fail if keywords property contains a string containing only spaces', function () {
			const packageJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
			packageJSON.keywords = ['      '];
			fs.writeFileSync('package.json', JSON.stringify(packageJSON), 'utf8');

			return verifyPackageJson().task()
				.catch(function (verifiedpackageJson) {
					proclaim.equal(
						verifiedpackageJson.message,
						'Failed linting:\n\n' +
						'The keywords property is required. It must be an array. It must contain only strings which relate to the component. It can also be an empty array.\n\n' +
						'The package.json file does not conform to the specification at https://origami.ft.com/spec/v2/components/#package-management'
					);
					proclaim.calledOnce(console.log);
					proclaim.calledWithExactly(
						console.log,
						`::error file=package.json,line=1,col=1::Failed linting:%0A%0AThe keywords property is required. It must be an array. It must contain only strings which relate to the component. It can also be an empty array.%0A%0AThe package.json file does not conform to the specification at https://origami.ft.com/spec/v2/components/#package-management`
					);
				});
		});


	});
});
