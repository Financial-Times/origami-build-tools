'use strict';

module.exports = (name) => {
	return `{
  "name": "${name.original}",
  "description": "",
  "ignore": [
    "**/.*",
    "node_modules",
    "bower_components",
    "test",
    "build"
  ],
  "main": [
    "main.scss",
    "main.js"
  ]
}`;
};
