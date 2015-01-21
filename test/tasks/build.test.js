'use strict';

var expect = require('expect.js');
var gulp = require('gulp');

var fs = require('fs-extra');
var path = require('path');

var build = require('../../lib/tasks/build');

var obtPath = process.cwd();
var oTestPath = 'test/fixtures/o-test';

describe('Build task', function() {
	describe('Build Js', function() {
		var pathSuffix = '-build-js';
		var buildTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

		before(function() {
			fs.copySync(path.resolve(obtPath, oTestPath), buildTestPath);
			process.chdir(buildTestPath);
			fs.writeFileSync('bower.json', JSON.stringify(
				{
					name: "o-test",
					main: "main.js"
				}
			), 'utf8');
		});

		after(function() {
			process.chdir(obtPath);
			fs.removeSync(buildTestPath);
		});

		afterEach(function() {
			if (fs.existsSync('build/main.js')) {
				fs.unlink('build/main.js');
				fs.rmdir('build');
			}
		});

		it('should work with default options', function(done) {
			build.js(gulp)
				.on('end', function() {
					var builtJs = fs.readFileSync('build/main.js', 'utf8');
					expect(builtJs.indexOf('sourceMappingURL')).to.not.be(-1);
					expect(builtJs.indexOf('var Test')).to.not.be(-1);
					expect(builtJs.indexOf('function Test() {\n\tvar name = \'test\';\n};')).to.not.be(-1);
					done();
				});
		});

		it('should work with production option', function(done) {
			build
				.js(gulp, {
					env: 'production'
				})
				.on('end', function() {
					var builtJs = fs.readFileSync('build/main.js', 'utf8');
					expect(builtJs.indexOf('sourceMappingURL')).to.be(-1);
					expect(builtJs.indexOf('var Test')).to.be(-1);
					expect(builtJs.indexOf('function Test() {\n\tvar name = \'test\';\n};')).to.be(-1);
					done();
			});
		});

		it('should build from custom source', function(done) {
			build
				.js(gulp, {
					js: './src/js/test.js'
				})
				.on('end', function() {
					var builtJs = fs.readFileSync('build/main.js', 'utf8');
					expect(builtJs.indexOf('sourceMappingURL')).to.not.be(-1);
					expect(builtJs.indexOf('var Test')).to.be(-1);
					expect(builtJs.indexOf('function Test() {\n\tvar name = \'test\';\n};')).to.not.be(-1);
					done();
				});
		});

		it('should build to a custom directory', function(done) {
			build
				.js(gulp, {
					buildFolder: 'test-build'
				})
				.on('end', function() {
					var builtJs = fs.readFileSync('test-build/main.js', 'utf8');
					expect(builtJs.indexOf('sourceMappingURL')).to.not.be(-1);
					expect(builtJs.indexOf('var Test')).to.not.be(-1);
					expect(builtJs.indexOf('function Test() {\n\tvar name = \'test\';\n};')).to.not.be(-1);
					fs.unlink('test-build/main.js');
					fs.rmdir('test-build');
					done();
				});
		});

		it('should build to a custom file', function(done) {
			build
				.js(gulp, {
					buildJs: 'bundle.js'
				})
				.on('end', function() {
					var builtJs = fs.readFileSync('build/bundle.js', 'utf8');
					expect(builtJs.indexOf('sourceMappingURL')).to.not.be(-1);
					expect(builtJs.indexOf('var Test')).to.not.be(-1);
					expect(builtJs.indexOf('function Test() {\n\tvar name = \'test\';\n};')).to.not.be(-1);
					fs.unlink('build/bundle.js');
					fs.rmdir('build');
					done();
				});
		});
	});

	describe('Build Sass', function() {
		var pathSuffix = '-build-sass';
		var buildTestPath = path.resolve(obtPath, oTestPath + pathSuffix);

		before(function() {
			fs.copySync(path.resolve(obtPath, oTestPath), buildTestPath);
			process.chdir(buildTestPath);
			fs.writeFileSync('bower.json', JSON.stringify(
				{
					name: "o-test",
					main: "main.scss"
				}
			), 'utf8');
		});

		after(function() {
			process.chdir(obtPath);
			fs.removeSync(path.resolve(obtPath, buildTestPath));
		});

		afterEach(function() {
			if (fs.existsSync('build/main.css')) {
				fs.unlink('build/main.css');
				fs.rmdir('build');
			}
		});

		it('should work with default options', function(done) {
			build.sass(gulp)
				.on('end', function() {
					var builtCss = fs.readFileSync('build/main.css', 'utf8');
					expect(builtCss).to.be('div {\n  color: blue; }\n');
					done();
				});
		});

		it('should work with production option', function(done) {
			build
				.sass(gulp, {
					env: 'production'
				})
				.on('end', function() {
					var builtCss = fs.readFileSync('build/main.css', 'utf8');
					expect(builtCss).to.be('div{color:#00f}');
					done();
			});
		});

		it('should build from custom source', function(done) {
			build
				.sass(gulp, {
					sass: './src/scss/test.scss'
				})
				.on('end', function() {
					var builtCss = fs.readFileSync('build/main.css', 'utf8');
					expect(builtCss).to.be('p {\n  color: black; }\n');
					done();
				});
		});

		it('should build to a custom directory', function(done) {
			build
				.sass(gulp, {
					buildFolder: 'test-build'
				})
				.on('end', function() {
					var builtCss = fs.readFileSync('test-build/main.css', 'utf8');
					expect(builtCss).to.be('div {\n  color: blue; }\n');
					fs.unlink('test-build/main.css');
					fs.rmdir('test-build');
					done();
				});
		});

		it('should build to a custom file', function(done) {
			build
				.sass(gulp, {
					buildCss: 'bundle.css'
				})
				.on('end', function() {
					var builtCss = fs.readFileSync('build/bundle.css', 'utf8');
					expect(builtCss).to.be('div {\n  color: blue; }\n');
					fs.unlink('build/bundle.css');
					fs.rmdir('build');
					done();
				});
		});
	});
});
