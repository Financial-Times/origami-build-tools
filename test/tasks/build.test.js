'use strict';

var expect = require('expect.js');
var gulp = require('gulp');

var fs = require('fs');

var build = require('../../lib/tasks/build');
var oTestPath = 'test/fixtures/o-test';

var rimraf = require('rimraf');

describe('Build task', function() {

	before(function() {
		process.chdir(oTestPath);
	});

	after(function() {
		process.chdir('../../..');
	});

	describe('Build Js', function() {
		before(function() {
			fs.writeFileSync('bower.json', JSON.stringify(
				{
					name: "o-test",
					main: "main.js"
				}
			), 'utf8');
		});

		after(function() {
			rimraf.sync('bower.json');
		});

		afterEach(function() {
			rimraf.sync('build');
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
					rimraf.sync('test-build');
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
					done();
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
					var jsFileName = JSON.parse(builtJsJson)['main.js'],
						jsFileContents = fs.readFileSync('build/' + jsFileName, 'utf8');
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
		before(function() {
			fs.writeFileSync('bower.json', JSON.stringify(
				{
					name: "o-test",
					main: "main.scss"
				}
			), 'utf8');
		});

		after(function() {
			rimraf.sync('bower.json');
			//TODO: get this working - the .sass-cache folder doesn't currently get deleted on my local machine
			rimraf.sync('.sass-cache');
		});

		afterEach(function() {
			rimraf.sync('build');
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
					rimraf.sync('test-build');
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
					var cssFileName = JSON.parse(builtCssJson)['main.css'],
						cssFileContents = fs.readFileSync('build/' + cssFileName, 'utf8');
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
