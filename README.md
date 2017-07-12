# origami-build-tools [![Build Status](https://travis-ci.org/Financial-Times/origami-build-tools.svg?branch=master)](https://travis-ci.org/Financial-Times/origami-build-tools)

Standardised build tools for Origami modules and products developed based on these modules.

If you have any issues with OBT, please check out [troubleshooting guide](https://github.com/Financial-Times/origami-build-tools/blob/master/TROUBLESHOOT.md) before raising an issue.

## Installation

1. Install these dependencies:
	* [node.js](http://nodejs.org/)

2. Install the build tools globally:

		npm install -g origami-build-tools

## Usage

	Usage
		$ obt <command> [<options>]

	Commands
		build   Build CSS and JS in current directory
		demo    Build demos into the demos directory
		install Install dependencies in current directory
		test    Run Origami specification tests and component specific tests
		verify  Check folder and code structure follows Origami specification

	Options
		-h, --help                 Print out this message
		--watch                    Re-run every time a file changes
		--run-server               Build demos locally and runs a server
		--js=<path>                Main JavaScript file (default: ./src/main.js)
		--sass=<path>              Main Sass file (default: ./src/main.scss)
		--build-js=<file>          Compiled JavaScript file (default: main.js)
		--build-css=<file>         Compiled CSS file (default: main.css)
		--build-folder=<dir>       Compiled assets directory (default: ./build/)
		-v, --version              Print out version of origami-build-tools
		--production               Compiled assets will be minified for production systems

### Developing products

Build CSS and JavaScript bundles in the `build` directory:

	origami-build-tools build

### Developing modules locally

Build and browse the demos (typically: <http://localhost:8080/demos/local/>),
automatically re-build the module's demos and assets every time a file changes:

	origami-build-tools demo --runServer --watch

## Commands

### `install`

Install npm and bower dependencies required to build modules.

### `build`

Build CSS and JavaScript bundles (typically, from `main.js` and `main.css`).

It comes with support for things like:

* [Babel](https://github.com/babel/babel) so you can use ES2017 features in your modules and products
* [autoprefixer](https://github.com/postcss/autoprefixer) so you don't have to worry about writing browser prefixes in your Sass
* If `--production` is set, JavaScript and CSS will be minified.

### `demo`

Build demos found in the [demo config file](http://origami.ft.com/docs/component-spec/modules/#demo-config).

* If `--production` is set, demos are built to pull assets through the Origami Build Service.

Non-production demos consist of HTML, CSS and JS (if Sass & JS exists), and are created in `demos/local/`. These files should not be committed. It is recommended to add _demos/local/_ to your `.gitignore`.

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
