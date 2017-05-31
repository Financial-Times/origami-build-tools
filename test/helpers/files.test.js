/* eslint-env mocha */
'use strict';

const process = require('process');
const expect = require('expect.js');

const fs = require('fs-extra');
const path = require('path');

const files = require('../../lib/helpers/files');

const obtPath = process.cwd();
const oTestPath = 'test/fixtures/o-test';
const pathSuffix = '-file';
const filesTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

describe('Files helper', function () {
	beforeEach(function () {
		fs.copySync(path.resolve(obtPath, oTestPath), filesTestPath);
		process.chdir(filesTestPath);
	});

	afterEach(function () {
		process.chdir(obtPath);
		fs.removeSync(filesTestPath);
	});

	it('should return correct build folder', function () {
		expect(files.getBuildFolderPath()).to.be(process.cwd() + '/build/');
	});

	it('should return module name', function () {
		return files.getModuleName()
			.then(name => {
				expect(name).to.be('');
			})
			.then(() => {
				fs.writeFileSync('bower.json', JSON.stringify({
					name: 'o-test'
				}), 'utf8');
				return files.getModuleName()
					.then(name => {
						expect(name).to.be('o-test');
						fs.unlinkSync(path.resolve(filesTestPath, 'bower.json'));
					});
			});
	});

	it('should return a list of Sass files', function () {
		return files.getSassFilesList().then(function (sassFiles) {
			const testResults = [path.join(process.cwd() + '/main.scss'), path.join(process.cwd() + '/src/scss/_variables.scss')];
			expect(sassFiles).to.contain(testResults[0]);
			expect(sassFiles).to.contain(testResults[1]);
		});
	});

	it('should check if the module supports silent mode', function () {
		fs.writeFileSync('bower.json', JSON.stringify({
			name: 'o-test'
		}), 'utf8');
		return files.getSassFilesList()
			.then(files.sassSupportsSilent)
			.then(function (supportsSilent) {
				expect(supportsSilent).to.be(true);
				fs.unlinkSync(path.resolve(filesTestPath, 'bower.json'));
			});
	});

	describe('Main files', function () {
		beforeEach(function () {
			fs.writeFileSync('bower.json', JSON.stringify({
				name: 'o-test'
			}), 'utf8');
		});

		afterEach(function () {
			fs.unlinkSync(path.resolve(filesTestPath, 'bower.json'));
		});

		it('should get the path of main.scss', function () {
			return files.getMainSassPath()
				.then(sassPath => {
					expect(sassPath).to.be(null);
					return files.getBowerJson()
						.then(bowerJson => {
							bowerJson.main = bowerJson.main || [];
							bowerJson.main.push('main.scss');
							fs.writeFileSync('bower.json', JSON.stringify(bowerJson), 'utf8');
							return files.getMainSassPath()
								.then(sassPath => {
									expect(sassPath).to.be(process.cwd() + '/main.scss');
								});
						});
				});
		});

		it('should get the path of main.js', function () {
			return files.getMainJsPath()
				.then(jsPath => {
					expect(jsPath).to.be(null);
					return files.getBowerJson()
						.then(bowerJson => {

							bowerJson.main = bowerJson.main || [];
							bowerJson.main.push('main.js');
							fs.writeFileSync('bower.json', JSON.stringify(bowerJson), 'utf8');
							return files.getMainJsPath()
								.then(jsPath => {

									expect(jsPath).to.be(process.cwd() + '/main.js');
								});
						});
				});
		});
	});

	describe('Bower.json', function () {
		beforeEach(function () {
			if (fs.existsSync(path.resolve(filesTestPath, 'bower.json'))) {
				fs.unlinkSync(path.resolve(filesTestPath, 'bower.json'));
			}
		});

		afterEach(function () {
			fs.unlinkSync(path.resolve(filesTestPath, 'bower.json'));
		});

		it('should get bower.json', function () {
			return files.getBowerJson()
				.then(bowerJson => {
					expect(typeof bowerJson).to.be('undefined');
					fs.writeFileSync('bower.json', JSON.stringify({}), 'utf8');
					return files.getBowerJson()
						.then(bowerJson => {
							expect(typeof bowerJson).to.not.be('undefined');
						});
				});
		});

		it('should check if bower.json is present', function () {
			return files.bowerJsonExists()
				.then(exists => {
					expect(exists).to.be(false);
					fs.writeFileSync('bower.json', JSON.stringify({}), 'utf8');
					return files.bowerJsonExists()
						.then(exists => {
							expect(exists).to.be(true);
						});
				});
		});
	});

	describe('Package.json', function () {
		beforeEach(function () {
			if (fs.existsSync(path.resolve(filesTestPath, 'package.json'))) {
				fs.unlinkSync(path.resolve(filesTestPath, 'package.json'));
			}
		});

		afterEach(function () {
			fs.unlinkSync(path.resolve(filesTestPath, 'package.json'));
		});

		it('should get package.json', function () {
			return files.getPackageJson()
				.then(packageJson => {

					expect(typeof packageJson).to.be('undefined');
					fs.writeFileSync('package.json', JSON.stringify({}), 'utf8');
					return files.getPackageJson()
						.then(packageJson => {

							expect(typeof packageJson).to.not.be('undefined');
						});
				});
		});

		it('should check if package.json is present', function () {
			return files.packageJsonExists()
				.then(exists => {

					expect(exists).to.be(false);
					fs.writeFileSync('package.json', JSON.stringify({}), 'utf8');
					return files.packageJsonExists()
						.then(exists => {

							expect(exists).to.be(true);
						});
				});
		});
	});

	describe('.getMustacheFilesList(basePath)', function () {
		const mustacheTestPath = path.resolve(filesTestPath, 'demos/src');
		const flatMustacheFiles = path.resolve(mustacheTestPath, 'flat');
		const nestedMustacheFiles = path.resolve(mustacheTestPath, 'nested');

		it('is a function', () => {
			expect(files.getMustacheFilesList).to.be.a('function');
		});

		it('returns an array', function () {
			return files.getMustacheFilesList(flatMustacheFiles)
				.then(mustacheFiles => {
					expect(mustacheFiles).to.be.an('array');
				});
		});

		describe('when the directory structure is one level deep', function () {

			it('returns an array of all of the mustache files in the directory', function () {
				return files.getMustacheFilesList(flatMustacheFiles)
					.then(mustacheFiles => {
						expect(mustacheFiles).to.eql([
							path.join(flatMustacheFiles, 'example-1.mustache'),
							path.join(flatMustacheFiles, 'example-2.mustache')
						]);
					});
			});

		});

		describe('when the directory structure has subdirectories', () => {

			it('returns an array of all of the mustache files in the directory and all subdirectories', function () {
				return files.getMustacheFilesList(nestedMustacheFiles)
					.then(mustacheFiles => {
						expect(mustacheFiles).to.eql([
							path.join(nestedMustacheFiles, 'example-1.mustache'),
							path.join(nestedMustacheFiles, 'example-2.mustache'),
							path.join(nestedMustacheFiles, 'folder-1/example-3.mustache'),
							path.join(nestedMustacheFiles, 'folder-1/folder-2/example-4.mustache')
						]);
					});
			});

		});

	});

});
