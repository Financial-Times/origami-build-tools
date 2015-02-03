/* global describe, it, before, after, afterEach */
'use strict';

require('es6-promise').polyfill();
var denodeify = require('denodeify');

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

		afterEach(function(done) {
			if (fs.existsSync('build/main.js')) {
				denodeify(fs.unlink)('build/main.js')
					.then(function() { return denodeify(fs.rmdir)('build'); })
					.then(function() { done(); }, done);
			}
		});

		it('should work with default options', function(done) {
			build.js(gulp)
				.on('end', function() {
					var builtJs = fs.readFileSync('build/main.js', 'utf8');
					expect(builtJs).to.contain('sourceMappingURL');
					expect(builtJs).to.contain('var Test');
					expect(builtJs).to.contain('function Test() {\n\tvar name = "test";');
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
					expect(builtJs).to.not.contain('sourceMappingURL');
					expect(builtJs).to.not.contain('var Test');
					expect(builtJs).to.not.contain('function Test() {\n\tvar name = "test";');
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
					expect(builtJs).to.contain('sourceMappingURL');
					expect(builtJs).to.not.contain('var Test');
					expect(builtJs).to.contain('function Test() {\n\tvar name = "test";');
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
					expect(builtJs).to.contain('sourceMappingURL');
					expect(builtJs).to.contain('var Test');
					expect(builtJs).to.contain('function Test() {\n\tvar name = "test";');
					denodeify(fs.unlink)('test-build/main.js')
						.then(function() { denodeify(fs.rmdir)('test-build'); })
						.then(function() { done(); }, done);
				});
		});

		it('should build to a custom file', function(done) {
			build
				.js(gulp, {
					buildJs: 'bundle.js'
				})
				.on('end', function() {
					var builtJs = fs.readFileSync('build/bundle.js', 'utf8');
					expect(builtJs).to.contain('sourceMappingURL');
					expect(builtJs).to.contain('var Test');
					expect(builtJs).to.contain('function Test() {\n\tvar name = "test";');
					denodeify(fs.unlink)('build/bundle.js')
						.then(function() { denodeify(fs.rmdir)('build'); })
						.then(function() { done(); }, done);
				});
		});

		it('should build a hashed version of the js', function(done) {
			build
				.js(gulp, {
					hash: true
				})
				.on('end', function() {
					var builtJsJson = fs.readFileSync('build/main.js-asset-hash.json', 'utf8');
					expect(builtJsJson.indexOf('main.js')).to.not.be(-1);
					var jsFileName = JSON.parse(builtJsJson)['main.js'];
					var jsFileContents = fs.readFileSync('build/' + jsFileName, 'utf8');
					expect(jsFileContents.length).to.be.greaterThan(1);
					done();
				});
		});

		it('should build a hashed version of the js with a bespoke filename', function(done) {
			build
				.js(gulp, {
					buildJs: 'dooDah.js',
					hash: true
				})
				.on('end', function() {
					var builtJsJson = fs.readFileSync('build/dooDah.js-asset-hash.json', 'utf8');
					expect(builtJsJson.indexOf('dooDah.js')).to.not.be(-1);
					var jsFileName = JSON.parse(builtJsJson)['dooDah.js'];
					var jsFileContents = fs.readFileSync('build/' + jsFileName, 'utf8');
					expect(jsFileContents.length).to.be.greaterThan(1);
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
				denodeify(fs.unlink)('build/main.css')
					.then(function() { return denodeify(fs.rmdir)('build'); })
					.then(function() { done(); }, done);
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


		it('should build a hashed version of the css', function(done) {
			build
				.sass(gulp, {
					hash: true
				})
				.on('end', function() {
					var builtCssJson = fs.readFileSync('build/main.css-asset-hash.json', 'utf8');
					expect(builtCssJson.indexOf('main.css')).to.not.be(-1);
					var cssFileName = JSON.parse(builtCssJson)['main.css'];
					var cssFileContents = fs.readFileSync('build/' + cssFileName, 'utf8');
					expect(cssFileContents.length).to.be.greaterThan(1);
					done();
				});
		});


		it('should build a hashed version of the css to a custom filename', function(done) {
			build
				.sass(gulp, {
					buildCss: 'dooDah.css',
					hash: true
				})
				.on('end', function() {
					var builtCssJson = fs.readFileSync('build/' + 'dooDah.css' + '-asset-hash.json', 'utf8');
					expect(builtCssJson.indexOf('dooDah.css')).to.not.be(-1);
					var cssFileName = JSON.parse(builtCssJson)['dooDah.css'];
					var cssFileContents = fs.readFileSync('build/' + cssFileName, 'utf8');
					expect(cssFileContents.length).to.be.greaterThan(1);
					done();
				});
		});
	});
});
