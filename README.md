# origami-build-tools [![Build Status](https://circleci.com/gh/Financial-Times/origami-build-tools/tree/master.svg?style=svg)](https://circleci.com/gh/Financial-Times/origami-build-tools/tree/master)

Standardised build tools for Origami modules and products developed based on these modules.

If you have any issues with OBT, please check out [troubleshooting guide](https://github.com/Financial-Times/origami-build-tools/blob/master/TROUBLESHOOT.md) before raising an issue.

- [Installation](#installation)
- [Usage](#usage)
- [Commands](#commands)
- [Migration guide](#migration-guide)
- [Licence](#licence)

## Installation

1. Install these dependencies:
	* [node.js](http://nodejs.org/)

2. Install the build tools globally:

		npm install -g origami-build-tools

## Usage

	Usage
		$ obt <command> [<options>]

	Commands
		build, b    Build CSS and JS in current directory
		demo, d     Build demos into the demos directory
		init        Initialise a new component with a boilerplate folder structure
		install, i  Install npm and bower dependencies required to build modules
		test, t     Run Origami specification tests and component specific tests
		verify, v   Check folder and code structure follows Origami specification

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
		--browserstack             Run tests using Browserstack instead of Chrome Stable
		--standalone               Create a named export for the built JavaScript
		--demo-filter=<demo-name>  Build a specific demo. E.G. --demo-filter=pa11y to build only the pa11y.html demo.
		--brand=<brand-name>       Build SCSS for a given brand. E.G. --brand=internal to build the component for the internal brand.
		--suppress-errors          Do not error if no demos are found when using the --demo-filter option.
		--debug                    Keep the test runner open to enable debugging in any browser.
		--verbose                  Output sass warnings with backtraces.

### Developing products

Build CSS and JavaScript bundles in the `build` directory:

	origami-build-tools build

### Developing modules locally

Build and browse the demos (typically: <http://localhost:8080/demos/local/>),
automatically re-build the module's demos and assets every time a file changes:

	origami-build-tools demo --runServer --watch

## Commands

### `install` or `i`

Install npm and bower dependencies required to build modules.

### `build` or `b`

Build CSS and JavaScript bundles (typically, from `main.js` and `main.css`).

It comes with support for things like:

* [Babel](https://github.com/babel/babel) so you can use ES2017 features in your modules and products
* [autoprefixer](https://github.com/postcss/autoprefixer) so you don't have to worry about writing browser prefixes in your Sass

Set the main JavaScript file with the `--js` option. _(default: ./src/main.js)_
Set the main Sass file with the `--sass` option. _(default: ./src/main.scss)_
Set the name of the built JS file with the `--build-js` option. _(default: main.js)_
Set the name of the built CSS file with the `--build-css` option. _(default: main.css)_
Set the name of the folder to store the built CSS and JS with the `--build-folder` option. _(default: ./build/)_
Build the files for production environments with the `--production` option. _(default: off)_

If building a library use the `--standalone` option to specify the name you want the library to be accessed with. _(default: off)_

### `demo` or `d`

Build demos found in the [demo config file](http://origami.ft.com/docs/component-spec/modules/#demo-config).

Build a specific demo with the `--demo-filter` option.

* If `--production` is set, demos are built to pull assets through the Origami Build Service.

Non-production demos consist of HTML, CSS and JS (if Sass & JS exists), and are created in `demos/local/`. These files should not be committed. It is recommended to add _demos/local/_ to your `.gitignore`.

### `verify` or `v`

Lints JavaScript, Sass and configuration files against [Origami coding standards](http://origami.ft.com/docs/syntax/).

### `test` or `t`

Run Origami specification tests and component specific tests.

* If `--debug` is set, the test runner will not exit automatically to allow debugging of the tests.

Checks Sass supports [silent and non-silent compilation modes](http://origami.ft.com/docs/syntax/scss/#silent-styles).
If `pa11y.html` demo exists, confirms it is accessible using [Pa11y](http://pa11y.org/).
If `package.json` contains a `test` script, confirms it exits with a 0 exit code.
Runs tests using [Karma](https://karma-runner.github.io) defaulting to Chrome Stable, can be configured to use BrowserStack by using the `--browserstack` flag. You will need the environment variables `BROWSER_STACK_USERNAME` and `BROWSER_STACK_ACCESS_KEY` set. This will run the tests on the minimum version for enhanced experience based on the [FT Browser Support Policy[(https://docs.google.com/document/d/1mByh6sT8zI4XRyPKqWVsC2jUfXHZvhshS5SlHErWjXU).


### `init`

Initialises a new component with a full boilerplate folder structure.

This command takes an argument in the form of a component name, which will populate all of the relevant files within that tree. Defaults to `o-component-boilerplate`.

e.g.
```
obt init o-my-new-component
```

## Migration guide


### Migrating from 8.X.X to 9.X.X

- NodeJS v8 is no longer supported. Use NodeJS v10 or above.
- [Dart Sass](https://github.com/sass/dart-sass), the reference implementation of Sass, is used instead of [Node Sass](https://github.com/sass/node-sass). You may need to update your Sass to be compatible with Dart Sass if an error is thrown during build.

### Migrating from 7.X.X to 8.X.X


OBT no longer supports NodeJS v6 because it uses async functions. To use this version of OBT, you will need NodeJS v8 or above.

### Migrating from 6.X.X to 7.X.X


The ability to use OBT via it's programmatic API has been removed, if you were using OBT via `gulp`, you will need to migrate to the command line version of OBT.
OBT has removed the ability to configure the way it installs/builds/verifies code, this is to ensure that systems built with OBT follows the Origami specification and conventions.


### Migrating from 5.X.X to 6.X.X

#### OBT build
The 6.0.0 release removes the ability for OBT to include the Babel/Core-JS polyfills in the built Javascript. If you are relying on this feature, we recommend that you use the [Polyfill service](https://polyfill.io) instead.

#### OBT verify
The 6.0.0 release swapped out [`scss-lint`](https://www.npmjs.com/package/gulp-scss-lint) for [`sass-lint`](https://www.npmjs.com/package/gulp-sass-lint).

If you are supplying your own custom scss-lint configuration you need to convert it to an equivalent sass-lint configuration, [here is a tool which can do this for you](https://sasstools.github.io/make-sass-lint-config/). The programatic API and CLI flag has also changed from `scssLintPath` to `sassLintPath`.

## Licence
This software is published by the Financial Times under the [MIT licence](http://opensource.org/licenses/MIT).
