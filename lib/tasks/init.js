'use strict';

const Listr = require('listr');

const buildBoilerplate = require('./boilerplate');

function camelCase (string) {
	return string.replace(/\-+(.)/g, (match, chr) => { return chr.toUpperCase(); });
}

function titleCase (string) {
	return string.toLowerCase().split('-').map(function(word) {
		return word.replace(word[0], word[0].toUpperCase());
	}).join('');
}

function plainName (string) {
	const regex = /^o-/gi;
	return string.replace(regex, '');
}

function plainTitleCase (string) {
	string = plainName(string);
	return titleCase(string);
}

module.exports = function (cfg) {
	cfg = cfg || {};
	const config = cfg.flags || {};
	config.cwd = config.cwd || process.cwd();
	config.name = cfg.input && cfg.input.length > 1 ? cfg.input[1] : 'o-component-boilerplate';
	config.name = {
		original: config.name,
		camelCase: camelCase(config.name),
		titleCase: titleCase(config.name),
		plainName: plainName(config.name),
		plainTitleCase: plainTitleCase(config.name)
	};

	return new Listr([{
		title: `Building '${config.name.original}' boilerplate`,
		task: () => buildBoilerplate(config),
		skip: () => false
	}], {
		renderer: require('../helpers/listr-renderer')
	})
		.run();
};

module.exports.watchable = false;
