# origami-build-tools [![Build Status](https://travis-ci.org/Financial-Times/origami-build-tools.svg?branch=master)](https://travis-ci.org/Financial-Times/origami-build-tools)

Standardised build tools for Origami modules and products developed based on these modules.

If you have any issues with OBT, please check out [troubleshooting guide](https://github.com/Financial-Times/origami-build-tools/blob/master/TROUBLESHOOT.md) before raising an issue.

## Installation

1. Install these dependencies:
	* [node.js](http://nodejs.org/)
	* [Ruby](https://www.ruby-lang.org/en/) (Macs typically ship with Ruby by default)

2. Install the build tools globally:

		npm install -g origami-build-tools

## Usage

Run the install task for the first time will to install required dependencies:

	origami-build-tools install

### Developing products

Build CSS and JavaScript bundles in the `build` directory:

	origami-build-tools build

### Developing modules locally

Build and browse the demos (typically: <http://localhost:8080/demos/local/>),
automatically re-build the module's demos and assets every time a file changes:

	origami-build-tools demo --runServer --watch

## Tasks

All the tasks are built using [gulp](http://gulpjs.com/), and almost all of them return a stream. They are structured in 5 higher level tasks, and each one has one or more subtasks.

	Usage: origami-build-tools <command> [<options>]

	Commands:
	   install  Install system and local dependencies
	   build    Build module in current directory
	   demo     Build demos into the demos/ directory
	   verify   Lint code and verify if module structure follows the Origami specification
	   test     Test if Sass silent compilation follows the Origami specification

	Most used options include:
	   [--watch]                    Re-run every time a file changes
	   [--runServer]                Build demos locally and runs a server
	   [--updateorigami]            Update origami.json with the latest demo files created
	   [--js=<path>]                Main JavaScript file (default: ./src/main.js)
	   [--sass=<path>]              Main Sass file (default: ./src/main.scss)
	   [--buildJs=<file>]           Compiled JavaScript file (default: main.js)
	   [--buildCss=<file>]          Compiled CSS file (default: main.css)
	   [--buildFolder=<dir>]        Compiled assets directory (default: ./build/)
	   [--scssLintPath=<path>]      Custom scss-lint configuration
	   [--esLintPath=<path>]        Custom esLint configuration
	   [--editorconfigPath=<path>]  Custom .editorconfig

### `install`

Install tools and dependencies required to build modules.

Runs:

* __installScssLint()__ globally (if it's not already installed)
* __installBower()__ globally (if it's not already installed)
* __runNpmInstall()__ if there is a `package.json` inthe root directory
* __runBowerInstall()__ using both the Origami Registry and the default Bower registry to resolve dependencies

The versions that are installed and supported are:

* scss-lint: '0.35.0'
* Bower: '^1.3.0'

Config:
* verbose: `Boolean` Outputs verbose results of bower and npm installation when `true`. For npm this will be the result of `--loglevel info`. (Default: false)

### `build`

Build CSS and JavaScript bundles (typically, from `main.js` and `main.css`).

It comes with support for things like:

* [Babel](https://github.com/babel/babel) so you can use ES2015 features in your modules and products
* [autoprefixer](https://github.com/postcss/autoprefixer) so you don't have to worry about writing browser prefixes in your Sass
* If `env` is set to `'production'`:
	- [uglifyJS](https://github.com/mishoo/UglifyJS2) which minimises your JavaScript bundle
	- [clean-css](https://github.com/jakubpawlowicz/clean-css) which minimises your CSS bundle

Runs:

* __js(gulp, config)__ Config accepts:
	- js: `String` Path to your main JavaScript file. (Default: './main.js' and checks your bower.json to see if it's in its main key)
	- buildJs: `String` Name of the built JavaScript bundle. (Default: 'main.js')
	- buildFolder: `String` Path to directory where the built file will be created. If set to `'disabled'`, files won't be saved. (Default: './build/')
	- env: `String` It can be either 'production' or 'development'. If it's 'production', it will run [uglify](https://github.com/mishoo/UglifyJS2). If it's 'development', it will generate a sourcemap. (Default: 'development')
	- cwd: `String` The path to the working directory, in which the code to be built exists. (Default: current working directory)
	- sourcemaps: `Boolean | 'inline'` Set to true to output sourcemaps as a separate file, even if env is 'production'. Set to 'inline' to output sourcemaps inline (Default: false in production, true in development)
	- loaders: `Array` Additional Webpack loaders for JavaScript files to run *before* imports-loader (removes AMD module support), babel-loader (which adds babel-runtime polyfills) and textrequireify-loader. OBT will search for loaders in its `node_modules` directory, but also in the project's `node_modules` folder. This way, you can install your own loaders and pass them to the `loaders` array by their name. e.g. `[coffee-loader]`
	- standalone: `String` Export built file to a global variable with the name passed to this (Default: '')
	- babelRuntime: `Boolean` Set to true by default. Setting to false will exclude Babel polyfills from the built file
* __sass(gulp, config)__ Config accepts:
	- sass: `String` Path to your main Sass file. (Default: './main.scss' and checks your bower.json to see if it's in its main key)
	- autoprefixerBrowsers: `Array` An array of strings of [browser names for autoprefixer](https://github.com/postcss/autoprefixer#browsers) to check what prefixes it needs. (Default: `["> 1%", "last 2 versions", "ie > 6", "ff ESR"]`)
	- autoprefixerCascade: `Boolean` Whether autoprefixer should display CSS prefixed properties [cascaded](https://github.com/postcss/autoprefixer#visual-cascade) (Default: false)
	- autoprefixerRemove: `Boolean` Remove unneeded prefixes (Default: true)
	- cwd: `String` The path to the working directory, in which the code to be built exists. (Default: current working directory)
	- buildCss: `String` Name of the built CSS bundle. (Default: 'main.css')
	- buildFolder: `String` Path to directory where the built file will be created. If set to `'disabled'`, files won't be saved. (Default: './build/')
	- sourcemaps: `Boolean | 'inline'` Set to true to output sourcemaps as a separate file, even if env is 'production'. Set to 'inline' to output sourcemaps inline (Default: false in production, true in development)
	- env: `String` It can be either 'production' or 'development'. If it's 'production', it will compile the Sass file with the 'compressed' style option and will also run [clean-css](https://github.com/jakubpawlowicz/clean-css). (Default: 'development')
	- cleanCss: `Object` Config object to pass to [clean-css](https://github.com/jakubpawlowicz/clean-css/blob/master/README.md#how-to-use-clean-css-programmatically). (Default: `{advanced: false}`)
	- sassIncludePaths: `Array` List of paths to search for Sass imports. (Default: '[]')

### `demo`

Build demos found in the [demo config file](http://origami.ft.com/docs/component-spec/modules/#demo-config).

Config:

* dist: `Boolean` Builds demo HTML for the build service. Default: `false`
* runServer: `Boolean` Whether you want to run a local server or not. Default: `false`
* livereload: `Boolean` Will enable livereload on `runServer`. Default: `true`
* demoFilter: `Array` List of files for OBT to build. If the array is empty or `undefined`, it will build all demos. This is something only used in the [build service](https://origami-build.ft.com). Default: `undefined`
* cwd: `String` The path to the working directory, in which the code to be built exists. (Default: current working directory)

Runs:

* __runServer(gulp)__ Starts a local server

Dist demos consist of only HTML, with build service URLs for static resources, and are created in `demos/`.

Local demos consist of HTML, CSS and JS (if Sass & JS exists), and are created in `demos/local/`. These files should not be committed. It is recommended to add _demos/local/_ to your `.gitignore`.

### `verify`

Lints JavaScript and SCSS against Origami coding standards (see standards for [SCSS](http://origami.ft.com/docs/syntax/scss/#syntax-convention-rules) and [JavaScript](http://origami.ft.com/docs/syntax/js/#syntax-convention-rules)).

Runs:

* __scssLint(gulp, config)__ Config accepts:
	- scssLintPath: `String` Path to your custom 'scss-lint.yml' config file. (Default: 'origami-build-tools/config/scss-lint.yml') _This may be set for product development, but developers of Origami-compliant components are required to accept the default_
	- excludeFiles `Array` e.g. `['!**/demo.scss']`
* __esLint(gulp, config)__ Config accepts:
	- esLintPath: `String` Path to your custom esLint config file. (Default: 'origami-build-tools/config/.eslintrc' _This may be set for product development, but developers of Origami-compliant components are required to accept the default_
	- excludeFiles `Array` e.g. `['!**/demo.js']`
* __lintspaces(gulp, config)__ Config accepts:
	- editorconfigPath: `String` Path to your '.editorconfig' that lintspaces uses for linting. (Default: 'origami-build-tools/config/.editorconfig') _This may be set for product development, but developers of Origami-compliant components are required to accept the default_
* __origamiJson()__ If there's an 'origami.json' file in your project's root, it will make sure it's compliant with the [spec](http://origami.ft.com/docs/syntax/origamijson/#format)

### `test`

* __silentCompilation(gulp)__ Test [silent compilation](http://origami.ft.com/docs/syntax/scss/#silent-styles). Check the Sass outputs no CSS by default. Only ran af a `$<module-name>-is-silent` variable is found
* __silentCompilation(gulp)__ Test [silent compilation](http://origami.ft.com/docs/syntax/scss/#silent-styles). Check the Sass outputs some CSS with `$<module-name>-is-silent` set to false. Only ran af a `$<module-name>-is-silent` variable is found
* __npmTest()__ Runs 'npm test', so whatever test script that you have in you `package.json` will be executed
* __browserTest(gulp, config)__ Runs [Nightwatch](http://nightwatchjs.org/) tests on our [Selenium](http://www.seleniumhq.org/projects/webdriver/) grid by deploying the demo pages to Heroku. This is an optional subtask that requires the config option _browserTest_ to be set to true. You also need to set the following environment variables:
	- HEROKU_AUTH_TOKEN: The result of running `heroku auth:token`
	- SELENIUM_USER: The username of the Selenium grid proxy
	- SELENIUM_KEY: The key to use the proxy to the Selenium grid
	- SELENIUM_HOST: The host of the Selenium grid or proxy
Config accepts:
	- testUrl: `String` Url to where the html the tests are going to run agains is. (Default: 'https://module-name.herokuapp.com')
	- nightwatchConfig: `String` Path to your 'nightwatch.json' file that Nightwatch uses for testing. (Default: `./test/browser/nightwatch.json`)
	- environments: `String` Comma separated list of environments from your nightwatch config file to run your tests on. (Default: `chrome_latest,chrome_latest-1,firefox_latest,firefox_latest-1,ie8_Grid,ie9_Grid,ie10_Grid,ie11_Grid,safari7_Grid`)
	- testsPath: `String` Relative path from your project's root directory to where your nightwatch tests are. (Default: `test/browser/tests`)
	- browserTestFailBuild: `Boolean` by default the failed browser tests will not fail the task, however you can override the default behaviour by setting this option to `true`. Default: `false`

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


The `origami-build-tools` module also defines some helper methods to verify and list the available tasks:

`obt.isValid(taskName)` will return a boolean value indicating whether the
name of the given task is valid.

`obt.list()` will return a list of valid task names.

`obt.loadAll()` will return an object with all of the available tasks loaded onto it.
Access tasks on this object as properties in the same way as the `obt` object.

## Licence
This software is published by the Financial Times under the [MIT licence](http://opensource.org/licenses/MIT).
