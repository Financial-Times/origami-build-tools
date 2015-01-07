# origami-build-tools [![Build Status](https://travis-ci.org/Financial-Times/origami-build-tools.svg)](https://travis-ci.org/Financial-Times/origami-build-tools)

Standardised build tools for Origami modules and products developed based on these modules.

## Installation

1. Install these dependencies:
	* [node.js](http://nodejs.org/)
	* [Ruby](https://www.ruby-lang.org/en/) (Macs typically ship with Ruby by default)

2. Install the build tools globally:

		npm install -g origami-build-tools

3. Run the `install` task for the first time will to install required dependencies:

		origami-build-tools install

## Developing locally

Browse the demos (typically: <http://localhost:8080/demos/local/>),
automatically re-build the module's demos and assets every time a file changes:

	origami-build-tools demo --local --watch

## Tasks

All the tasks are built using [gulp](http://gulpjs.com/), and almost all of them return a stream. They are structured in 5 higher level tasks, and each one has one or more subtasks.

	Usage: origami-build-tools <command> [<options>]

	Commands:
	   install  Install system and local dependencies
	   build    Build module in current directory
	   demo     Build demos into the demos/ directory
	   verify   Lint code and verify if module structure follows the Origami specification
	   test     Test if Sass silent compilation follows the Origami specification
	   docs     Build module documentation into the docs/ directory

	Mostly used options include:
	   [--watch]                    Re-run every time a file changes
	   [--local]                    Build demos locally, and preview them in a browser
	   [--updateorigami]            Update origami.json with the latest demo files created
	   [--js=<path>]                Main JavaScript file (default: ./src/main.js)
	   [--sass=<path>]              Main Sass file (default: ./src/main.scss)
	   [--buildJs=<file>]           Compiled JavaScript file (default: main.js)
	   [--buildCss=<file>]          Compiled CSS file (default: main.css)
	   [--buildFolder=<dir>]        Compiled assets directory (default: ./build/)
	   [--scssLintPath=<path>]      Custom scss-lint configuration
	   [--jsHintPath=<path>]        Custom JS Hint configuration
	   [--editorconfigPath=<path>]  Custom .editorconfig

### `install`

Install tools and dependencies required to build modules.

Runs:

* __installSass()__ globally (if it's not already installed)
* __installScssLint()__ globally (if it's not already installed)
* __installJshint()__ globally (if it's not already installed)
* __installBower()__ globally (if it's not already installed)
* __runNpmInstall()__ if there is a `package.json` inthe root directory
* __runBowerInstall()__ using both the Origami Registry and the default Bower registry to resolve dependencies

The versions that are installed and supported are:

* Sass: '3.3.14' _(Sass 3.4.x is currently not supported and you may not get the desired result)_
* scss-lint: '0.27.0'
* JSHint: '2.5.6'
* Bower: '1.3.12'

### `build`

Build CSS and JavaScript bundles (typically, from `main.js` and `main.css`).


Runs:

* __js(gulp, config)__ Config accepts:
	- js: `String` Path to your main JavaScript file. (Default: './main.js' and checks your bower.json to see if it's in its main key)
	- buildJs: `String` Name of the built JavaScript bundle. (Default: 'main.js')
	- buildFolder: `String` Path to directory where the built file will be created. (Default: './build/')
	- env: `String` It can be either 'production' or 'development'. If it's 'production', it will run [uglify](https://github.com/mishoo/UglifyJS2). If it's 'development', it will generate a sourcemap. (Default: 'development')
	- sourcemaps: `Boolean` Set to true to output sourcemaps, even if env is 'development'
	- compress: `Boolean|Object` Set to true to minify js and sass.  Pass object to specify different options for js and sass, eg `{js:true,sass:false}`
	- transforms: `Array` Additional browserify transforms to run *after* debowerify and textrequireify. Each transform should be specified as one of the following
		- `String` The name of the transform
		- `Array` [config, 'transform-name'] Where custom config needs to be passed into the transform use an array containing the config object followed by the transform name
		- `Object` Some transforms require passing in a single object which both specifies and configures the transform
	- insertGlobals: See [browserify documentation](https://github.com/substack/node-browserify#usage)
	- detectGlobals: See [browserify documentation](https://github.com/substack/node-browserify#usage)
	- ignoreMissing: See [browserify documentation](https://github.com/substack/node-browserify#usage)
	- standalone: See [browserify documentation](https://github.com/substack/node-browserify#usage)
* __sass(gulp, config)__ Config accepts:
	- sass: `String` Path to your main Sass file. (Default: './main.scss' and checks your bower.json to see if it's in its main key)
	- autoprefixerBrowsers: `Array` An array of strings of [browser names for autoprefixer](https://github.com/postcss/autoprefixer#browsers) to check what prefixes it needs. (Default: `["> 1%", "last 2 versions", "ie > 6", "ff ESR"]`)
	- autoprefixerCascade: `Boolean` Whether autoprefixer should display CSS prefixed properties [cascaded](https://github.com/postcss/autoprefixer#visual-cascade) (Default: false)
	- autoprefixerRemove: `Boolean` Remove unneeded prefixes (Default: true)
	- buildCss: `String` Name of the built CSS bundle. (Default: 'main.css')
	- compress: `Boolean|Object` Set to true to minify js and sass.  Pass object to specify different options for js and sass, eg `{js:false,sass:true}`
	- buildFolder: `String` Path to directory where the built file will be created. (Default: './build/')
	- env: `String` It can be either 'production' or 'development'. If it's 'production', it will compile the Sass file with the 'compressed' style option and will also run [csso](https://github.com/css/csso). (Default: 'development')

	_(Sourcemaps aren't generated as this feature is incompatible with csso. We will revisit this when [gulp-ruby-sass](https://github.com/sindresorhus/gulp-ruby-sass) 1.0 is released)_

### `demo`

Build demos found in the [demo config file](http://origami.ft.com/docs/component-spec/modules/#demo-config-file) into the `demos/` directory.

Config:

* local: `Boolean` Build local HTML, CSS and JS files, in addition to demo HTML for the build service. Also runs a local server to help you test your demos.
* demoConfig: `String` The path to the demo config file. Default: `demos/src/config.json`
* updateorigami: `Boolean` The `demos` property of your `origami.json` file will be updated - to list the demo files that have been created.

Runs:

* __runServer(gulp)__ Starts a local server

Build service demos consist of only HTML, with build service URLs for static resources, and are created in `demos/`.

Local demos consist of HTML, CSS and JS (if Sass & JS exists), and are created in `demos/local/`. These files should not be committed. It is recommended to add demos/local/ to your `.gitignore`.

_(Sourcemaps aren't generated as this feature is incompatible with csso. We will revisit this when [gulp-ruby-sass](https://github.com/sindresorhus/gulp-ruby-sass) 1.0 is released)_



### `verify`

Lints JavaScript and SCSS against Origami coding standards (see standards for [SCSS](http://origami.ft.com/docs/syntax/scss/#syntax-convention-rules) and [JavaScript](http://origami.ft.com/docs/syntax/js/#syntax-convention-rules)).

Runs:

* __scssLint(gulp, config)__ Config accepts:
	- sass: `String` Path to your main Sass file. (Default: './main.scss' and checks your bower.json to see if it's in its main key)
	- scssLintPath: `String` Path to your custom 'scss-lint.yml' config file. (Default: 'origami-build-tools/config/scss-lint.yml') _This may be set for product development, but developers of Origami-compliant components are required to accept the default_
* __jsHint(gulp, config)__ Config accepts:
	- js: `String` Path to your main Javascript file. (Default: './main.js' and checks your bower.json to see if it's in its main key)
	- jsHintPath: `String` Path to your custom jsHint config file. (Default: 'origami-build-tools/config/jshint.json' _This may be set for product development, but developers of Origami-compliant components are required to accept the default_
* __lintspaces(gulp, config)__ Config accepts:
	- editorconfigPath: `String` Path to your '.editorconfig' that lintspaces uses for linting. (Default: 'origami-build-tools/config/.editorconfig') _This may be set for product development, but developers of Origami-compliant components are required to accept the default_
* __origamiJson()__ If there's an 'origami.json' file in your project's root, it will make sure it's compliant with the [spec](http://origami.ft.com/docs/syntax/origamijson/#format)

### `test`

Test [silent compilation](http://origami.ft.com/docs/syntax/scss/#silent-styles).
If a `$<module-name>-is-silent` variable is found, then runs:

* __silentCompilation(gulp)__ Check the Sass outputs no CSS by default
* __silentCompilation(gulp)__ Check the Sass outputs some CSS with `$<module-name>-is-silent` set to false
* __npmTest()__ Runs 'npm test', so whatever test script that you have in you `package.json` will be executed

### `docs`

Build component documentation into the `docs` directory.

Runs:

* __sassDoc(gulp, config)__ Sass documentation is built using [SassDoc](http://sassdoc.com/). Config accepts:
	- sassDir: `String` Path to the directory where you main Sass file is. (Default: '.')
	- Any option supported by the [SassDoc gulp plugin](http://sassdoc.com/gulp/#options)

## gulpfile usage

Use the build tools in your own Gulp file to incorporate the Origami build process into a *product* (don't use this method if you are building an Origami component). An in depth explanation of how to use the `origami-build-tools` in your product to build Origami modules can be found in the [Origami spec](http://origami.ft.com/docs/developer-guide/building-modules/).

To run these tasks in your `gulpfile.js`, you only need to require `origami-build-tools` and run the task or subtask you need, passing gulp and an optional config object.

```js
var gulp = require('gulp');
var obt = require('origami-build-tools');

gulp.task('build', function() {
	obt.build.js(gulp, {js: './src/main.js'});
	obt.build.sass(gulp, {sass: './src/main.scss'});
});

gulp.task('verify', function() {
	obt.verify(gulp, {
		js: './src/main.js',
		sass: './src/main.scss'
	});
});
```

Note: to use this you will need to install origami-build-tools *and* gulp as direct dependencies of your project.  Additionally, if you do not have it installed already, you will also need to install gulp globally.

```sh
npm install --save-dev origami-build-tools
npm install --save-dev gulp
npm install -g gulp
```
