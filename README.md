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
		-v, --version              Print out version of origami-build-tools
		--browserstack             Run tests using Browserstack instead of Chrome Stable
		--demo-filter=<demo-name>  Build a specific demo. E.G. --demo-filter=pa11y to build only the pa11y.html demo.
		--brand=<brand-name>       Build SCSS for a given brand. E.G. --brand=internal to build the component for the internal brand.
		--debug                    Keep the test runner open to enable debugging in any browser.

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

Set the name of the built CSS file with the `--build-css` option. _(default: main.css)_
Set the name of the folder to store the built CSS and JS with the `--build-folder` option. _(default: ./build/)_


### `demo` or `d`

Build demos found in the [demo config file](http://origami.ft.com/docs/component-spec/modules/#demo-config).

Build a specific demo with the `--demo-filter` option.

Demos consist of HTML, CSS and JS (if Sass & JS exists), and are created in `demos/local/`. These files should not be committed. It is recommended to add _demos/local/_ to your `.gitignore`.

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


### Migrating from 9.X.X to 10.X.X

- NodeJS v10 is no longer supported. Use NodeJS v12 or above.
- A default CommonJs export now maps to `module.exports.default`, the default [Babel](https://babeljs.io/) behaviour. If using `require` to include a default CommonJs export add a `.default` property to the `require` call. Alternatively update your project to use [ECMAScript Module syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).
- Removed the `--js` flag.
- Removed the `--sass` flag.
- Removed the `--build-js` flag.
- Removed the `--build-css` flag.
- Removed the `--build-folder` flag.
- Removed the `--standalone` flag.
- Removed the `--verbose` flag.
- The `--suppress-errors` flag has been removed. OBT no longer throws an error if their are no demos to be built if passed the `--demo-filter` flag.
- v10 replaces the deprecated [scss-lint](https://github.com/sasstools/sass-lint) with [stylelint](https://github.com/stylelint/stylelint). Your component may fail the verify check and require updates, including:
	- If your component uses Sass comments to temporarily disable linting (e.g. `// sass-lint:disable`) replace these with the [equivalent stylelint-disable comment for stylelint](https://stylelint.io/user-guide/ignore-code).
	- Components by default must be indented with tabs, unless configured otherwise.
	- Empty blocks will now error `.nothing-here {}`
	- Duplicate `@import` statements will throw an error
	- `@import` paths which include an extension or prefixed `_` will error instead of warn
	- `@include` and `@extend` will error instead of warn if used after property declarations
	- Nesting selectors beyond a depth of three will now error instead of warn
	- Duplicate CSS property declarations error instead of warn


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
