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

### test

Tests [silent compilation](http://origami.ft.com/docs/syntax/scss/#silent-styles).  If your SASS contains a `$<module-name>-is-silent` variable, then runs:

* __silentCompilation(gulp)__ Check the SASS outputs no CSS by default
* __silentCompilation(gulp)__ Check the SASS outputs some CSS with `$<module-name>-is-silent` set to false

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
* updateorigami: `Boolean` The `demos` property of your `origami.json` file will be updated - to list the demo files that have been created.

Runs:

* __runServer(gulp)__ Starts a local server

AB: Surely it also runs build?

Build service demos consist of only HTML, with build service URLs for static resources, and are created in `demos/`

Local demos consist of HTML, CSS and JS (if SASS & JS exists), and are created in `demos/local/`. A CSS sourcemap is also generated. These files should not be committed. It is recommended to add demos/local/ to your `.gitignore`.

## gulpfile usage

Use the build tools in your own Gulp file to incorporate the Origami build process into a *product* (don't use this method if you are building an Origami component).  To run these tasks in your `gulpfile.js`, you only need to require `origami-build-tools` and run the task or subtask you need, passing gulp and an optional config object.

```js
var gulp = require('gulp');
var obt = require('origami-build-tools');

gulp.task('build', function() {
    obt.build.js(gulp, {js: 'src/main.js'});
});
```

## Command Line usage

Component developers should use the build tools as a command line utility, though product developers can choose to use the command line interface too. In the directory of your Origami module or product, run:

    origami-build-tools <command>

Where `<command>` is one of the tasks explained above. To pass config options to the command line, add them as arguments like this: `--js=src/main.js`.  The CLI supports the following arguments in addition to the gulpfile config options:

### Unnamed argument for demo path

For the demo command, you can also add an unnamed parameter:

* `<config file>`: The path to the demo config file. Default: `demos/src/config.json`

AB: Shouldn't we just standardise this and make it a gulp arg?

### Watching

The commands `build`, `test`, `verify` and `demo` can be run with the argument `--watch` to automatically re-run when files change.

Example:

    origami-build-tools demo /demos/src/config.json --local --watch
