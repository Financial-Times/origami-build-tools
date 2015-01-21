'use strict';

var expect = require('expect.js');
require('es6-promise').polyfill();

var fs = require('fs-extra');
var path = require('path');

var files = require('../../lib/helpers/files');

var obtPath = process.cwd();
var oTestPath = 'test/fixtures/o-test';
var pathSuffix = '-file';
var filesTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

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
		fs.writeFileSync('bower.json', JSON.stringify({ name: "o-test" }), 'utf8');
		expect(files.getModuleName()).to.be('o-test');
		fs.unlink(path.resolve(filesTestPath, 'bower.json'));
	});

	it('should return a list of Sass files', function(done) {
		files.getSASSFilesList().then(function(files) {
			var testResults = [path.join(process.cwd() + '/main.scss'), path.join(process.cwd() + '/src/scss/_variables.scss')];
			expect(files).to.contain(testResults[0]);
			expect(files).to.contain(testResults[1]);
			done();
		});
	});

	it('should check if the module supports silent mode', function(done) {
		fs.writeFileSync('bower.json', JSON.stringify({ name: "o-test" }), 'utf8');
		files.getSASSFilesList()
			.then(files.sassSupportsSilent)
			.then(function(supportsSilent) {
				expect(supportsSilent).to.be(true);
				fs.unlink(path.resolve(filesTestPath, 'bower.json'));
				done();
			});
	});

	describe('Main files', function() {
		before(function() {
			fs.writeFileSync('bower.json', JSON.stringify({ name: "o-test" }), 'utf8');
		});

		after(function() {
			fs.unlink(path.resolve(filesTestPath, 'bower.json'));
		});

		it('should get the path of main.scss', function() {
			expect(files.getMainSassPath()).to.be(null);
			var bowerJson = files.getBowerJson();
			bowerJson.main = bowerJson.main || [];
			bowerJson.main.push('main.scss');
			fs.writeFileSync('bower.json', JSON.stringify(bowerJson), 'utf8');
			expect(files.getMainSassPath()).to.be(process.cwd() + '/main.scss');
		});

		it('should get the path of main.js', function() {
			expect(files.getMainJsPath()).to.be(null);
			var bowerJson = files.getBowerJson();
			bowerJson.main = bowerJson.main || [];
			bowerJson.main.push('main.js');
			fs.writeFileSync('bower.json', JSON.stringify(bowerJson), 'utf8');
			expect(files.getMainJsPath()).to.be(process.cwd() + '/main.js');
		});
	});

	describe('Bower.json', function() {
		afterEach(function() {
			fs.unlink(path.resolve(filesTestPath, 'bower.json'));
		});

		it('should get bower.json', function() {
			expect(typeof files.getBowerJson()).to.be('undefined');
			fs.writeFileSync('bower.json', JSON.stringify({}), 'utf8');
			expect(typeof files.getBowerJson()).to.not.be("undefined");
		});

		it('should check if bower.json is present', function() {
			expect(files.bowerJsonExists()).to.be(false);
			fs.writeFileSync('bower.json', JSON.stringify({}), 'utf8');
			expect(files.bowerJsonExists()).to.be(true);
		});
	});

	describe('Package.json', function() {
		afterEach(function() {
			fs.unlink(path.resolve(filesTestPath, 'package.json'));
		});

		it('should get package.json', function() {
			expect(typeof files.getPackageJson()).to.be('undefined');
			fs.writeFileSync('package.json', JSON.stringify({}), 'utf8');
			expect(typeof files.getPackageJson()).to.not.be("undefined");
		});

		it('should check if package.json is present', function() {
			expect(files.packageJsonExists()).to.be(false);
			fs.writeFileSync('package.json', JSON.stringify({}), 'utf8');
			expect(files.packageJsonExists()).to.be(true);
		});
	});
});


