# Troubleshooting Origami Build Tools

Different common issues encountered when using OBT organized by the different tasks.

## `install`

### Installing Node.js

Node is available in most package management repositories, and instructions are available in the Node install guide:

[Install Node.js via package manager](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager)

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

### Installing Ruby

We recommend you install Ruby using the `rbenv` version manager instead of using the default Mac or Linux repository versions. This will ensure Ruby Gems have permissions correctly set and allow you to easily migrate to different versions of Ruby.

1. Check out rbenv into `~/.rbenv`.

	~~~ sh
	$ git clone https://github.com/sstephenson/rbenv.git ~/.rbenv
	~~~

2. Add `~/.rbenv/bin` to your `$PATH` for access to the `rbenv` command-line utility.

	~~~ sh
	$ echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bash_profile
	~~~

	**Ubuntu Desktop note**: Modify your `~/.bashrc` instead of `~/.bash_profile`.

	**Zsh note**: Modify your `~/.zshrc` file instead of `~/.bash_profile`.

3. Add `rbenv init` to your shell to enable shims and autocompletion.

	~~~ sh
	$ echo 'eval "$(rbenv init -)"' >> ~/.bash_profile
	~~~

_Same as in previous step, use `~/.bashrc` on Ubuntu, or `~/.zshrc` for Zsh._

4. Restart your shell so that PATH changes take effect. (Opening a new terminal tab will usually do it.) Now check if rbenv was set up:

	~~~ sh
	$ type rbenv
	#=> "rbenv is a function"
	~~~

5. Install ruby-build, which provides the `rbenv install` command that simplifies the process of installing new Ruby versions.

	~~~ sh
	$ git clone https://github.com/sstephenson/ruby-build.git ~/.rbenv/plugins/ruby-build
	~~~

6. Install the latest version of Ruby by checking the [Ruby website](https://www.ruby-lang.org) (2.2.3 as of writing) and avoid jRuby or Rubinius as these haven't been tested with OBT:

	~~~ sh
	# list all available versions:
	$ rbenv install -l
	
	# install the latest version version of Ruby:
	$ rbenv install 2.2.3
	~~~

7. Use this version of Ruby in all shells:
	~~~ sh
	$ rbenv global 2.2.3

### Error `While executing gem ... (Gem::FilePermissionError)`

When installing [SCSS-Lint](https://github.com/causes/scss-lint), depending on how permissions are set on your machine, OBT might fail and return:

>While executing gem ... (Gem::FilePermissionError).
>You don't have write permissions for the /Library/Ruby/Gems/2.0.0 directory.

This can be fixed by following the [Installing Ruby steps](#installing-ruby) mentioned above.

### Error `npm ERR! argv "/usr/local/bin/node" "/usr/local/bin/npm" "install" "-g" "bower" "--quiet"`

When installing [bower](https://bower.io), depending on how permissions are set on your machine, OBT might fail and return something like this:

>npm ERR! Darwin 14.3.0
>npm ERR! argv "/usr/local/bin/node" "/usr/local/bin/npm" "install" "-g" "bower" "--quiet"
>npm ERR! node v0.12.2
>npm ERR! npm  v2.1.6
>npm ERR! path /usr/local/lib/node_modules/bower
>npm ERR! code EACCES
>npm ERR! errno -13
>
>npm ERR! Error: EACCES, unlink '/usr/local/lib/node_modules/bower'
>npm ERR!     at Error (native)
>npm ERR!  { [Error: EACCES, unlink '/usr/local/lib/node_modules/bower']
>npm ERR!   errno: -13,
>npm ERR!   code: 'EACCES',
>npm ERR!   path: '/usr/local/lib/node_modules/bower' }
>npm ERR!
>npm ERR! Please try running this command again as root/Administrator.

This can be fixed by following the guide above on [fixing npm permissions](#fix-npm-permissions).

### Warning `Origami registry is not configured in a .bowerrc file`

Origami modules are listed on Origami's custom Bower registry, and aren't available to the global, public one. Custom registries can be added to a `.bowerrc` configuration file located in your home directory. To create a `.bowerrc` configuration file now, run::

```bash
echo '{"registry":{"search":["http://registry.origami.ft.com","https://bower.herokuapp.com"]}}' > ~/.bowerrc
```

### Error `fatal: unable to connect to github.com"`

This can happen if the git protocol is blocked on your network. To get around this you can use the http protocol instead:

```bash
echo -e '[url "http://"]\n    insteadOf = git://' >> ~/.gitconfig
```

### Error `Unable to download data from https://rubygems.org/`

If you receive an error specifying `Unable to download data from https://rubygems.org/ - SSL_connect returned=1 errno=0 state=SSLv3 read server certificate B: certificate verify failed (https://api.rubygems.org/specs.4.8.gz)` you'll need to manually update your gem package using the directions in [this gist](https://gist.github.com/luislavena/f064211759ee0f806c88).