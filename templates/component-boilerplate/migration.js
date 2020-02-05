'use strict';

module.exports = (name) => {
	return `_Migration guides are very important! Always include one for major releases. To create a codeblock that has diff highlighting, use three backticks followed by the word diff_

### Migrating from 1.X.X to 2.X.X

The 2.0.0 release changes the default behaviour of ${name.original}.

\`\`\`diff
<div class="${name.original}__container">
- remove this line
+ add this line
</div>
\`\`\`
`;
};
