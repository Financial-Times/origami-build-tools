'use strict';

const Listr = require('listr');

const buildBoilerplateTree = require('./boilerplate-tree');

function camelCase (string) {
	return string.replace(/\-+(.)/g, (match, chr) => { return chr.toUpperCase(); });
}

function titleCase (string) {
	return string.toLowerCase().split('-').map(function(word) {
		return word.replace(word[0], word[0].toUpperCase());
	}).join('');
}

module.exports = function (cfg) {
	cfg = cfg || {};
	const config = cfg.flags || {};
	config.name = cfg.input[1] || 'o-component-boilerplate';
	config.name = {
		original: config.name,
		camelCase: camelCase(config.name),
		titleCase: titleCase(config.name)
	};
	config.cwd = config.cwd || process.cwd();

	return new Listr([{
		title: 'BUILDING COMPONENT BOILERPLATE 🌳 💪',
		task: () => {
			buildBoilerplateTree(config);
		}
	}], {
		renderer: require('../helpers/listr-renderer')
	}).run();
};

module.exports.watchable = false;
