/* global describe, it, before, after, beforeEach, afterEach */
'use strict';

const expect = require('expect.js');

const fs = require('fs-extra');
const path = require('path');

const files = require('../../lib/helpers/files');

const obtPath = process.cwd();
const oTestPath = 'test/fixtures/o-test';
const pathSuffix = '-file';
const filesTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

describe('Files helper', function() {
	before(function() {
		fs.copySync(path.resolve(obtPath, oTestPath), filesTestPath);
		process.chdir(filesTestPath);
	});

	after(function() {
		process.chdir(obtPath);
		fs.removeSync(filesTestPath);
	});

	it('should return correct build folder', function() {
		expect(files.getBuildFolderPath()).to.be(process.cwd() + '/build/');
	});

	it('should return module name', function() {
		expect(files.getModuleName()).to.be('');
		fs.writeFileSync('bower.json', JSON.stringify({ name: 'o-test' }), 'utf8');
		expect(files.getModuleName()).to.be('o-test');
		fs.unlink(path.resolve(filesTestPath, 'bower.json'));
	});

	it('should return a list of Sass files', function() {
		return files.getSassFilesList().then(function(sassFiles) {
			const testResults = [path.join(process.cwd() + '/main.scss'), path.join(process.cwd() + '/src/scss/_variables.scss')];
			expect(sassFiles).to.contain(testResults[0]);
			expect(sassFiles).to.contain(testResults[1]);
		});
	});

	it('should check if the module supports silent mode', function() {
		fs.writeFileSync('bower.json', JSON.stringify({ name: 'o-test' }), 'utf8');
		return files.getSassFilesList()
			.then(files.sassSupportsSilent)
			.then(function(supportsSilent) {
				expect(supportsSilent).to.be(true);
				fs.unlink(path.resolve(filesTestPath, 'bower.json'));
			});
	});

	describe('Main files', function() {
		before(function() {
			fs.writeFileSync('bower.json', JSON.stringify({ name: 'o-test' }), 'utf8');
		});

		after(function() {
			fs.unlink(path.resolve(filesTestPath, 'bower.json'));
		});

		it('should get the path of main.scss', function() {
			expect(files.getMainSassPath()).to.be(null);
			const bowerJson = files.getBowerJson();
			bowerJson.main = bowerJson.main || [];
			bowerJson.main.push('main.scss');
			fs.writeFileSync('bower.json', JSON.stringify(bowerJson), 'utf8');
			expect(files.getMainSassPath()).to.be(process.cwd() + '/main.scss');
		});

		it('should get the path of main.js', function() {
			expect(files.getMainJsPath()).to.be(null);
			const bowerJson = files.getBowerJson();
			bowerJson.main = bowerJson.main || [];
			bowerJson.main.push('main.js');
			fs.writeFileSync('bower.json', JSON.stringify(bowerJson), 'utf8');
			expect(files.getMainJsPath()).to.be(process.cwd() + '/main.js');
		});
	});

	describe('Bower.json', function() {
		beforeEach(function() {
			if (fs.existsSync(path.resolve(filesTestPath, 'bower.json'))) {
				fs.unlink(path.resolve(filesTestPath, 'bower.json'));
			}
		});

		afterEach(function() {
			fs.unlink(path.resolve(filesTestPath, 'bower.json'));
		});

		it('should get bower.json', function() {
			expect(typeof files.getBowerJson()).to.be('undefined');
			fs.writeFileSync('bower.json', JSON.stringify({}), 'utf8');
			expect(typeof files.getBowerJson()).to.not.be('undefined');
		});

		it('should check if bower.json is present', function() {
			expect(files.bowerJsonExists()).to.be(false);
			fs.writeFileSync('bower.json', JSON.stringify({}), 'utf8');
			expect(files.bowerJsonExists()).to.be(true);
		});
	});

	describe('Package.json', function() {
		beforeEach(function() {
			if (fs.existsSync(path.resolve(filesTestPath, 'package.json'))) {
				fs.unlinkSync(path.resolve(filesTestPath, 'package.json'));
			}
		});

		afterEach(function() {
			fs.unlink(path.resolve(filesTestPath, 'package.json'));
		});

		it('should get package.json', function() {
			expect(typeof files.getPackageJson()).to.be('undefined');
			fs.writeFileSync('package.json', JSON.stringify({}), 'utf8');
			expect(typeof files.getPackageJson()).to.not.be('undefined');
		});

		it('should check if package.json is present', function() {
			expect(files.packageJsonExists()).to.be(false);
			fs.writeFileSync('package.json', JSON.stringify({}), 'utf8');
			expect(files.packageJsonExists()).to.be(true);
		});
	});

	describe('.getMustacheFilesList(basePath)', () => {
		const mustacheTestPath = path.resolve(filesTestPath, 'demos/src');
		const flatMustacheFiles = path.resolve(mustacheTestPath, 'flat');
		const nestedMustacheFiles = path.resolve(mustacheTestPath, 'nested');

		it('is a function', () => {
			expect(files.getMustacheFilesList).to.be.a('function');
		});

		it('returns an array', () => {
			const mustacheFiles = files.getMustacheFilesList(flatMustacheFiles);
			expect(mustacheFiles).to.be.an('array');
		});

		describe('when the directory structure is one level deep', () => {

			it('returns an array of all of the mustache files in the directory', () => {
				const mustacheFiles = files.getMustacheFilesList(flatMustacheFiles);
				expect(mustacheFiles).to.eql([
					path.join(flatMustacheFiles, 'example-1.mustache'),
					path.join(flatMustacheFiles, 'example-2.mustache')
				]);
			});

		});

		describe('when the directory structure has subdirectories', () => {

			it('returns an array of all of the mustache files in the directory and all subdirectories', () => {
				const mustacheFiles = files.getMustacheFilesList(nestedMustacheFiles);
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
