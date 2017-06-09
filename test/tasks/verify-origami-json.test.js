/* eslint-env mocha */
'use strict';

const proclaim = require('proclaim');
const process = require('process');
const fs = require('fs-extra');
const path = require('path');

const verifyOrigamiJson = require('../../lib/tasks/verify-origami-json');

const obtPath = process.cwd();
const oTestPath = 'test/fixtures/o-test';
const pathSuffix = '-verify';
const verifyTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

describe('verify-origami-json', function () {
	beforeEach(function () {
		fs.copySync(path.resolve(obtPath, oTestPath), verifyTestPath);
		process.chdir(verifyTestPath);
		fs.writeFileSync('src/scss/verify.scss', '$color: #ccc;\n\np {\n  color: $color!important ;\n}\n', 'utf8');
		fs.writeFileSync('src/js/verify.js', 'const test = \'We live in financial times\';\n');
	});

	afterEach(function () {
		process.chdir(obtPath);
		fs.removeSync(path.resolve(obtPath, verifyTestPath));
	});

	describe('default title', () => {
		it('should be "Verifying your origami.json"', () => {
			proclaim.equal(verifyOrigamiJson.title, 'Verifying your origami.json');
		});
	});

	describe('skip', () => {
		it('should return true if the file does not exist', () => {
			fs.removeSync(path.join(process.cwd(), '/origami.json'));
			proclaim.ok(verifyOrigamiJson.skip());
		});

		it('should return a helpful message if the file does not exist', function() {
			fs.removeSync(path.join(process.cwd(), '/origami.json'));
			return verifyOrigamiJson.skip()
				.then(skipped => {
					proclaim.equal(skipped, `No origami.json file found. To make this an origami component, create a file at ${path.join(process.cwd(), '/origami.json')} following the format defined at: http://origami.ft.com/docs/syntax/origamijson/`);
				});
		});

		it('should return a falsey value if the file does exist', function () {
			return verifyOrigamiJson.skip()
				.then(skipped => {
					proclaim.notOk(skipped);
				});
		});
	});

	describe('task', function () {
		it('should run origami.json check successfully', function () {
			return verifyOrigamiJson.task().
				then(function (verifiedOrigamiJson) {
					proclaim.equal(verifiedOrigamiJson.length, 0);
				});
		});

		it('should fail with an empty origami.json', function () {
			fs.writeFileSync('origami.json', JSON.stringify({}), 'utf8');

			return verifyOrigamiJson.task()
				.catch(function (verifiedOrigamiJson) {
					proclaim.equal(
						verifiedOrigamiJson.message,
						'Failed linting:\n\n' +
						'A non-empty description property is required\n' +
						'The origamiType property needs to be set to either "module" or "service"\n' +
						'The origamiVersion property needs to be set to 1\n' +
						'The support property must be an email or url to an issue tracker for this module\n' +
						'The supportStatus property must be set to either "active", "maintained", "deprecated", "dead" or "experimental"\n\n' +
						'The origami.json file does not conform to the specification at http://origami.ft.com/docs/syntax/origamijson/'
					);
				});
		});

		it('should fail if missing description property', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			delete origamiJSON.description;
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task()
				.catch(function (verifiedOrigamiJson) {
					proclaim.equal(
						verifiedOrigamiJson.message,
						'Failed linting:\n\n' +
						'A non-empty description property is required\n\n' +
						'The origami.json file does not conform to the specification at http://origami.ft.com/docs/syntax/origamijson/'
					);
				});
		});

		it('should fail if description property is an empty string', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			origamiJSON.description = '';
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task()
				.catch(function (verifiedOrigamiJson) {
					proclaim.equal(
						verifiedOrigamiJson.message,
						'Failed linting:\n\n' +
						'A non-empty description property is required\n\n' +
						'The origami.json file does not conform to the specification at http://origami.ft.com/docs/syntax/origamijson/'
					);
				});
		});

		it('should fail if description property is a string containing only spaces', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			origamiJSON.description = '      ';
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task()
				.catch(function (verifiedOrigamiJson) {
					proclaim.equal(
						verifiedOrigamiJson.message,
						'Failed linting:\n\n' +
						'A non-empty description property is required\n\n' +
						'The origami.json file does not conform to the specification at http://origami.ft.com/docs/syntax/origamijson/'
					);
				});
		});

		it('should fail if missing origamiType property', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			delete origamiJSON.origamiType;
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task()
				.catch(function (verifiedOrigamiJson) {
					proclaim.equal(
						verifiedOrigamiJson.message,
						'Failed linting:\n\n' +
						'The origamiType property needs to be set to either "module" or "service"\n\n' +
						'The origami.json file does not conform to the specification at http://origami.ft.com/docs/syntax/origamijson/'
					);
				});
		});

		it('should fail if origamiType property is not "module" or "service"', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			origamiJSON.origamiType = '';
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task()
				.catch(function (verifiedOrigamiJson) {
					proclaim.equal(
						verifiedOrigamiJson.message,
						'Failed linting:\n\n' +
						'The origamiType property needs to be set to either "module" or "service"\n\n' +
						'The origami.json file does not conform to the specification at http://origami.ft.com/docs/syntax/origamijson/'
					);
				});
		});

		it('should pass if origamiType property is "module"', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			origamiJSON.origamiType = 'module';
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task();
		});

		it('should pass if origamiType property is "service"', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			origamiJSON.origamiType = 'service';
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task();
		});

		it('should fail if missing origamiVersion property', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			delete origamiJSON.origamiVersion;
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task()
				.catch(function (verifiedOrigamiJson) {
					proclaim.equal(
						verifiedOrigamiJson.message,
						'Failed linting:\n\n' +
						'The origamiVersion property needs to be set to 1\n\n' +
						'The origami.json file does not conform to the specification at http://origami.ft.com/docs/syntax/origamijson/'
					);
				});
		});

		it('should fail if origamiVersion property is not 1', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			origamiJSON.origamiVersion = 2;
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task()
				.catch(function (verifiedOrigamiJson) {
					proclaim.equal(
						verifiedOrigamiJson.message,
						'Failed linting:\n\n' +
						'The origamiVersion property needs to be set to 1\n\n' +
						'The origami.json file does not conform to the specification at http://origami.ft.com/docs/syntax/origamijson/'
					);
				});
		});

		it('should pass if origamiVersion property is 1', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			origamiJSON.origamiVersion = 1;
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task();
		});

		it('should fail if missing support property', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			delete origamiJSON.support;
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task()
				.catch(function (verifiedOrigamiJson) {
					proclaim.equal(
						verifiedOrigamiJson.message,
						'Failed linting:\n\n' +
						'The support property must be an email or url to an issue tracker for this module\n\n' +
						'The origami.json file does not conform to the specification at http://origami.ft.com/docs/syntax/origamijson/'
					);
				});
		});

		it('should fail if support property is not an email address or url', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			origamiJSON.support = '   ';
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task()
				.catch(function (verifiedOrigamiJson) {
					proclaim.equal(
						verifiedOrigamiJson.message,
						'Failed linting:\n\n' +
						'The support property must be an email or url to an issue tracker for this module\n\n' +
						'The origami.json file does not conform to the specification at http://origami.ft.com/docs/syntax/origamijson/'
					);
					proclaim.equal(
						verifiedOrigamiJson.message,
						'Failed linting:\n\n' +
						'The supportStatus property must be set to either "active", "maintained", "deprecated", "dead" or "experimental"\n\n' +
						'The origami.json file does not conform to the specification at http://origami.ft.com/docs/syntax/origamijson/'
					);
				});
		});

		it('should pass if support property is an email address', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			origamiJSON.support = 'support@example.com';
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task();
		});

		it('should pass if support property is a url', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			origamiJSON.support = 'https://example.com';
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task();
		});

		it('should fail if missing supportStatus property', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			delete origamiJSON.supportStatus;
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task()
				.catch(function (verifiedOrigamiJson) {
					proclaim.equal(
						verifiedOrigamiJson.message,
						'Failed linting:\n\n' +
						'The supportStatus property must be set to either "active", "maintained", "deprecated", "dead" or "experimental"\n\n' +
						'The origami.json file does not conform to the specification at http://origami.ft.com/docs/syntax/origamijson/'
					);
				});
		});

		it('should fail if supportStatus property is not "active", "maintained", "deprecated", "dead" or "experimental"', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			origamiJSON.supportStatus = '  ';
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task()
				.catch(function (verifiedOrigamiJson) {
					proclaim.equal(
						verifiedOrigamiJson.message,
						'Failed linting:\n\n' +
						'The supportStatus property must be set to either "active", "maintained", "deprecated", "dead" or "experimental"\n\n' +
						'The origami.json file does not conform to the specification at http://origami.ft.com/docs/syntax/origamijson/'
					);
				});
		});

		it('should pass if supportStatus property is "active"', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			origamiJSON.supportStatus = 'active';
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task();
		});

		it('should pass if supportStatus property is "maintained"', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			origamiJSON.supportStatus = 'maintained';
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task();
		});

		it('should pass if supportStatus property is "deprecated"', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			origamiJSON.supportStatus = 'deprecated';
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task();
		});

		it('should pass if supportStatus property is "dead"', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			origamiJSON.supportStatus = 'dead';
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task();
		});

		it('should pass if supportStatus property is "experimental"', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			origamiJSON.supportStatus = 'experimental';
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task();
		});

		it('should fail when an expanded property is found for a demo', function () {
			const origamiJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'origami.json'), 'utf-8'));
			origamiJSON.demos = [{
				expanded: false
			}, {
				expanded: true
			}];
			fs.writeFileSync('origami.json', JSON.stringify(origamiJSON), 'utf8');

			return verifyOrigamiJson.task()
				.catch(function (verifiedOrigamiJson) {
					proclaim.equal(
						verifiedOrigamiJson.message,
						'Failed linting:\n\n' +
						'The expanded property has been deprecated. Use the "hidden" property when a demo should not appear in the Registry.\n\n' +
						'The origami.json file does not conform to the specification at http://origami.ft.com/docs/syntax/origamijson/'
					);
				});
		});
	});

});
