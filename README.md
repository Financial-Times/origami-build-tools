# origami-build-tools [![Build Status](https://travis-ci.org/Financial-Times/origami-build-tools.svg?branch=master)](https://travis-ci.org/Financial-Times/origami-build-tools)

Standardised build tools for Origami modules and products developed based on these modules.

If you have any issues with OBT, please check out [troubleshooting guide](https://github.com/Financial-Times/origami-build-tools/blob/master/TROUBLESHOOT.md) before raising an issue.

## Installation

1. Install these dependencies:
	* [node.js](http://nodejs.org/)

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
	   [--watch]                     Re-run every time a file changes
	   [--run-server]                Build demos locally and runs a server
	   [--updateorigami]             Update origami.json with the latest demo files created
	   [--js=<path>]                 Main JavaScript file (default: ./src/main.js)
	   [--sass=<path>]               Main Sass file (default: ./src/main.scss)
	   [--build-js=<file>]           Compiled JavaScript file (default: main.js)
	   [--build-css=<file>]          Compiled CSS file (default: main.css)
	   [--build-folder=<dir>]        Compiled assets directory (default: ./build/)

### `install`

Install npm and bower dependencies required to build modules.

### `build`

Build CSS and JavaScript bundles (typically, from `main.js` and `main.css`).

It comes with support for things like:

* [Babel](https://github.com/babel/babel) so you can use ES2017 features in your modules and products
* [autoprefixer](https://github.com/postcss/autoprefixer) so you don't have to worry about writing browser prefixes in your Sass
* If `env` is set to `'production'`, JavaScript and CSS will be minified.

Runs:

* __js(config)__ Config accepts:
	- js: `String` Path to your main JavaScript file. (Default: './main.js' and checks your bower.json to see if it's in its main key)
	- buildJs: `String` Name of the built JavaScript bundle. (Default: 'main.js')
	- buildFolder: `String` Path to directory where the built file will be created. If set to `'disabled'`, files won't be saved. (Default: './build/')
	- env: `String` It can be either `'production'` or `'development'`. If it's `'production'`, it will minify the file. If it's `'development'`, it will generate a sourcemap. (Default: `'development'`)
	- cwd: `String` The path to the working directory, in which the code to be built exists. (Default: `process.cwd()`)
	- sourcemaps: `Boolean | 'inline'` Set to `true` to output sourcemaps as a separate file, even if env is `'production'`. Set to `'inline'` to output sourcemaps inline (Default: `false` in production, `true` in development)
	- standalone: `String` Export built file to a global variable with the name passed to this.
* __sass(config)__ Config accepts:
	- sass: `String` Path to your main Sass file. (Default: `'./main.scss'` and checks your bower.json to see if it's in its main key)
	- autoprefixerBrowsers: `Array` An array of strings of [browser names for autoprefixer](https://github.com/postcss/autoprefixer#browsers) to check what prefixes it needs. (Default: `["> 1%", "last 2 versions", "ie > 6", "ff ESR"]`)
	- autoprefixerCascade: `Boolean` Whether autoprefixer should display CSS prefixed properties [cascaded](https://github.com/postcss/autoprefixer#visual-cascade) (Default: `false`)
	- autoprefixerRemove: `Boolean` Remove unneeded prefixes (Default: `true`)
	- cwd: `String` The path to the working directory, in which the code to be built exists. (Default: `process.cwd()`)
	- buildCss: `String` Name of the built CSS bundle. (Default: `'main.css'`)
	- buildFolder: `String` Path to directory where the built file will be created. If set to `'disabled'`, files won't be saved. (Default: `'./build/'`)
	- sourcemaps: `Boolean | 'inline'` Set to `true` to output sourcemaps as a separate file, even if env is `'production'`. Set to `'inline'` to output sourcemaps inline (Default: `false` in production, `true` in development)
	- env: `String` It can be either `'production'` or `'development'`. If it's `'production'`, it will compile the Sass file with the `'compressed'` style option and will also run [clean-css](https://github.com/jakubpawlowicz/clean-css). (Default: `'development'`)
	- sassIncludePaths: `Array` List of paths to search for Sass imports. (Default: `'[]'`)

### `demo`

Build demos found in the [demo config file](http://origami.ft.com/docs/component-spec/modules/#demo-config).

Config:

* dist: `Boolean` Builds demo HTML for the build service. Default: `false`
* runServer: `Boolean` Whether you want to run a local server or not. Default: `false`
* livereload: `Boolean` Will enable livereload on `runServer`. Default: `true`
* demoFilter: `Array` List of files for OBT to build. If the array is empty or `undefined`, it will build all demos. This is something only used in the [build service](https://origami-build.ft.com). Default: `undefined`
* cwd: `String` The path to the working directory, in which the code to be built exists. (Default: `process.cwd()`)

Dist demos consist of only HTML, with build service URLs for static resources, and are created in `demos/`.

Local demos consist of HTML, CSS and JS (if Sass & JS exists), and are created in `demos/local/`. These files should not be committed. It is recommended to add _demos/local/_ to your `.gitignore`.

### `verify`

Lints JavaScript, Sass and configuration files against [Origami coding standards](http://origami.ft.com/docs/syntax/).

### `test`

Checks Sass supports [silent and non-silent compilation modes](http://origami.ft.com/docs/syntax/scss/#silent-styles).
If `pa11y.html` demo exists, confirms it is accessible.
If `package.json` contains a `test` script, confirms it exits with a 0 exit code.

## Migration guide

### Migrating from 6.X.X to 7.X.X


The ability to use OBT via it's programmatic API has been removed, if you were using OBT via `gulp`, you will need to migrate to the commandline version of OBT.
OBT has removed the ability to configure the way it installs/builds/verifies code, this is to ensure that systems built with OBT follows the Origami specifcation and conventions.

### Migrating from 5.X.X to 6.X.X

#### OBT build
The 6.0.0 release removes the ability for OBT to include the Babel/Core-JS polyfills in the built Javascript. If you are relying on this feature, we recommend that you use the [Polyfill service](https://polyfill.io) instead.

#### OBT verify
The 6.0.0 release swapped out [`scss-lint`](https://www.npmjs.com/package/gulp-scss-lint) for [`sass-lint`](https://www.npmjs.com/package/gulp-sass-lint).

If you are supplying your own custom scss-lint configuration you need to convert it to an equivalent sass-lint configuration, [here is a tool which can do this for you](https://sasstools.github.io/make-sass-lint-config/). The progammatic API and CLI flag has also changed from `scssLintPath` to `sassLintPath`.

## Licence
This software is published by the Financial Times under the [MIT licence](http://opensource.org/licenses/MIT).
