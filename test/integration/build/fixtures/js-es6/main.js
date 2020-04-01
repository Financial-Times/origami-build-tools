'use strict';

const compute = ({
	object = self,
	property = 'world'
}, ...numbers) => {
	let result = 0;
	for (const number of numbers) {
		result = result + number;
	}
	object[property] = result;
};

compute({}, 1, 1);
