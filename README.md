# origami-build-tools

Standardised build tools for Origami components.

## Installation

    npm install -g https://github.com/Financial-Times/origami-build-tools/tarball/master

## Usage

In your Origami module directory run:

    origami-build-tools <command>

Where `<command>` is one of:

### install

This will do the following:

* __Install the SASS Ruby gem__ (if your module has a `main.scss` in its root)
* __Install Bower__ globally
* __Install Grunt CLI__ globally
* __Install Browserify__ globally
* __Run npm install__ (if your module has a `package.json` in its root)
* __Run bower install__ (if your module has a `bower.json` in its root)

### test

This will do the following:

* __SASS compilation__:
    * Basic compile of `main.scss` (if it exists)
    * If your SASS contains a `$<module-name>-is-silent` variable, then also:
        * Check the SASS outputs no CSS by default
        * Check the SASS outputs some CSS with `$<module-name>-is-silent` set to false
* __Build JS__:
    * ___Run Browserify__ on `main.js` (if it exists), with `debowerify` and `brfs` transforms