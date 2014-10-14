# origami-build-tools

Standardised build tools for Origami modules and products developed based on these modules.

## Installation

You should already have the following installed:

* Node JS (with NPM)
* Ruby

`npm install -g https://github.com/Financial-Times/origami-build-tools/tarball/master`

## Tasks

All the tasks are built using [gulp](http://gulpjs.com/), and almost all of them return a stream. They are structured in 5 higher level tasks, and each one has one or more subtasks. 

### install

Installs all the tools and dependencies required for the Origami build process to build your components.

Runs:

* __installSass()__ globally (if it's not already installed)
* __installScssLint()__ globally (if it's not already installed)
* __installJshint()__ globally (if it's not already installed)
* __installBower()__ globally (if it's not already installed)
* __runNpmInstall()__ if there is a `package.json` inthe root directory
* __runBowerInstall()__ using both the Origami Registry and the default Bower registry to resolve dependencies

The versions that are installed and supported are:

* SASS: '3.3.14' _(SASS 3.4.x is currently not supported and you may not get the desired result)_
* scss-lint: '0.27.0'
* JSHint: '2.5.6'
* Bower: '1.3.12'

### build

Builds CSS and JavaScript bundles from their respective main acting files and saves the built output into your working tree.

Runs:

* __js(gulp, config)__ Config accepts:
    - js: `String` Path to your main javascript file. (Default: './main.js' and checks your bower.json to see if it's in its main key) 
    - buildJs: `String` Name of the built javascript bundle. (Default: 'main.js')
    - buildDir: `String` Path to directory where the built file will be created. (Default: './build/')
* __sass(gulp, config)__ Config accepts:
    - sass: `String` Path to your main sass file. (Default: './main.scss' and checks your bower.json to see if it's in its main key) 
    - buildCss: `String` Name of the built CSS bundle. (Default: 'main.css')
    - buildDir: `String` Path to directory where the built file will be created. (Default: './build/')

    _(Sourcemaps aren't generated as this feature is incompatible with csso. We will revisit this when [gulp-ruby-sass](https://github.com/sindresorhus/gulp-ruby-sass) 1.0 is released)_

### test

Tests [silent compilation](http://origami.ft.com/docs/syntax/scss/#silent-styles).  If your SASS contains a `$<module-name>-is-silent` variable, then runs:

* __silentCompilation(gulp)__ Check the SASS outputs no CSS by default
* __silentCompilation(gulp)__ Check the SASS outputs some CSS with `$<module-name>-is-silent` set to false
* __npmTest()__ Runs 'npm test', so whatever test script that you have in you `package.json` will be executed

### verify

Lints JavaScript and SCSS against Origami coding standards (see standards for [SCSS](http://origami.ft.com/docs/syntax/scss/#syntax-convention-rules) and [JavaScript](http://origami.ft.com/docs/syntax/js/#syntax-convention-rules)).

Runs:

* __scssLint(gulp, config)__ Config accepts:
    - sass: `String` Path to your main sass file. (Default: './main.scss' and checks your bower.json to see if it's in its main key)
* __jsHint(gulp, config)__ Config accepts:
    - js: `String` Path to your main javascript file. (Default: './main.js' and checks your bower.json to see if it's in its main key) 

### demo

Builds component demos into the `demo` directory from a demo config file.

Config:

* local: `Boolean` Build local HTML, CSS and JS files, in addition to demo HTML for the build service. Also runs a local server to help you test your demos.
* demoConfig: `String` The path to the demo config file. Default: `demos/src/config.json`
* updateorigami: `Boolean` The `demos` property of your `origami.json` file will be updated - to list the demo files that have been created.

Runs:

* __runServer(gulp)__ Starts a local server

Build service demos consist of only HTML, with build service URLs for static resources, and are created in `demos/`

Local demos consist of HTML, CSS and JS (if SASS & JS exists), and are created in `demos/local/`. These files should not be committed. It is recommended to add demos/local/ to your `.gitignore`.

_(Sourcemaps aren't generated as this feature is incompatible with csso. We will revisit this when [gulp-ruby-sass](https://github.com/sindresorhus/gulp-ruby-sass) 1.0 is released)_

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

## Command Line usage

Component developers should use the build tools as a command line utility, though product developers can choose to use the command line interface too. In the directory of your Origami module or product, run:

    origami-build-tools <command>

Where `<command>` is one of the tasks explained above. To pass config options to the command line, add them as arguments like this: `--js=src/main.js`.

### Watching

The commands `build`, `test`, `verify` and `demo` can be run with the argument `--watch` to automatically re-run when files change.

Example:

    origami-build-tools demo /demos/src/config.json --local --watch
