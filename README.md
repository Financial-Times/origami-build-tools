# origami-build-tools

Standardised build tools for Origami modules.

## Installation

You should already have the following installed:

* Node JS (with NPM)
* Ruby


`npm install -g https://github.com/Financial-Times/origami-build-tools/tarball/master`

## Usage

In your Origami module directory run:

    origami-build-tools <command>

Where `<command>` is one of:

### install

Install all dependencies:

* __Install the SASS Ruby gem__ (if your module has a `main.scss` in its root, and the gem is not already installed)
* __Install Bower__ globally (if it's not already installed)
* __Run npm install__ (if your module has a `package.json` in its root)
* __Run bower install__ (using both the Origami Registry and the default Bower registry to resolve dependencies)
* __Install linting tools__ if `jshint` or `scss-lint` are not installed, this will install the minimum versions)

### build

* Compile `main.scss` (if it exists and is listed in `bower.json` main)
* Browserify `main.js` (if it exists and is listed in `bower.json` main)

Generated files are placed in a /build folder. These files should not be committed to the module repo.

### test

Runs `build`, and then also runs basic standard tests on the module:

* __SASS__ If your SASS contains a `$<module-name>-is-silent` variable, then also:
    * Check the SASS outputs no CSS by default
    * Check the SASS outputs some CSS with `$<module-name>-is-silent` set to false

### verify

Runs linting tools based on the minimum requirements set out in the Origami
standard.  If your module has a `main.js` file, `jshint` will be run. If you have a
`main.scss` file `scss-lint`.  `verify` is watchable with the `--watch`
command line flag.

### demo

Parameters:

* `<config file>`: The path to the demo config file. Default: `demos/src/config.json`

Switches:

* `--local` Build local HTML, CSS and JS files, in addition to demo HTML for the build service.
* `--updateorigami` The `demos` property of your `origami.json` file will be updated - to list the demo files that have been created.

Build static demo pages from demo source files, according to a spec in a config JSON file.

Build service demos consist of only HTML, with build service URLs for static resources.

Local demos consist of HTML, CSS and JS (if SASS & JS exists), and are created in `demos/local/`. These files should not be committed. It is recommended to add demos/local/ to your `.gitignore`.

#### Examples

Building demos for build service, using default config file location:

    origami-build-tool demo

Building demos for local development, using custom config file location:

    origami-build-tool demo demos/demo-config.json --local

#### Demo config file

The demo config file tells __origami-build-tools__ what demo files to build. It has two main properties:

* `options`: configuration to apply to all demos (unless overridden for a specific demo)
* `demos`: list of demos to build, keyed by the output HTML file name

Options, and individual demos, can have the following properties:

* `template`: The mustache template to render.
* `sass`: The SASS file to compile.
* `js`: The JS file to build with Browserify.
* `data`: Data to pass to the mustache template.
* `bodyClasses`: String. CSS classes to set on the body.
* `expanded`: (default: `true`) Whether the demo should be shown in expanded form in the [Registry](registry.origami.ft.com).
* `description`: Optional explanation of the purpose of the demo.

Example:

```json
{
    "options": {
        "sass": "demos/src/demo.scss",
        "data": "demos/src/data.json",
        "bodyClasses": "o-hoverable-on"
    },
    "demos": [
        {
            "name": "demo1",
            "template": "demos/src/demo1.mustache",
            "js": "demos/src/demo1.js"
        },
        {
            "name": "demo2",
            "template": "demos/src/demo2.mustache",
            "js": "demos/src/demo2.js",
            "expanded": false,
            "description": "Demo of obscure but realistic scenario."
        }
    ]
}
```

Demo CSS and JS will be built with sourcemaps.

## Watching

The commands `build`, `test`, `verify` and `demo` can be run with the switch `--watch` to automatically re-run when files change.

Example:

    origami-build-tools demo /demos/src/config.json --local --watch

## Travis CI build configuration

If your module has no other tests, then your Travis build can configured with just one file:

`.travis.yml`:

```yaml
language: node_js
node_js:
  - "0.10"
before_install:
  - npm install -g https://github.com/Financial-Times/origami-build-tools/tarball/master
  - origami-build-tools install
script:
  - origami-build-tools test
```
