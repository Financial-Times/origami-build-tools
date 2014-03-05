# origami-build-tools

Standardised build tools for Origami components.

## Installation

    npm install -g https://github.com/Financial-Times/origami-build-tools/tarball/master

## Usage

In your Origami module directory run:

    origami-build-tools install

This will do the following:

* __Install the SASS Ruby gem__ (if your module has a `main.scss` in its root)
* __Install Bower__
* __Install Grunt CLI__
* __Run npm install__ (if your module has a `package.json` in its root)
* __Run bower install__ (if your module has a `bower.json` in its root)

