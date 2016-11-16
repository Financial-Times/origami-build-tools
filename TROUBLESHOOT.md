# Troubleshooting Origami Build Tools

Different common issues encountered when using OBT organized by the different tasks.

## `install`

### Installing Node.js

Node is available in most package management repositories, and instructions are available in the Node install guide:

[Install Node.js via package manager](https://nodejs.org/en/download/package-manager)

#### Fix npm permissions

npm should not require root access when installing packages. If you get an `EACCES` error when installing a package globally, you'll need to fix npm's permissions:

1. Make a directory for global installations:

	```bash
	mkdir ~/npm-global
	```

2. Configure npm to use the new directory path:

	```bash
	npm config set prefix '~/npm-global'
	```

3. Open or create a ~/.bash_profile file and add this line:

	```bash
	export PATH=~/npm-global/bin:$PATH
	```

	**Ubuntu Desktop note**: Modify your `~/.bashrc` instead of `~/.bash_profile`.

	**Zsh note**: Modify your `~/.zshrc` file instead of `~/.bash_profile`.

4. Back on the command line, update your system variables:

	```bash
	source ~/.bash_profile
	```

Test: Download a package globally without using sudo.
```bash
npm install -g origami-build-tools
```
