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

	it('should return a list of Sass files', function(done) {
		files.getSassFilesList().then(function(sassFiles) {
			const testResults = [path.join(process.cwd() + '/main.scss'), path.join(process.cwd() + '/src/scss/_variables.scss')];
			expect(sassFiles).to.contain(testResults[0]);
			expect(sassFiles).to.contain(testResults[1]);
			done();
		});
	});

	it('should check if the module supports silent mode', function(done) {
		fs.writeFileSync('bower.json', JSON.stringify({ name: 'o-test' }), 'utf8');
		files.getSassFilesList()
			.then(files.sassSupportsSilent)
			.then(function(supportsSilent) {
				expect(supportsSilent).to.be(true);
				fs.unlink(path.resolve(filesTestPath, 'bower.json'));
				done();
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
				fs.unlink(path.resolve(filesTestPath, 'package.json'));
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
});
