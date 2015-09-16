# Troubleshooting Origami Build Tools

Different common issues encountered when using OBT organized by the different tasks.

### Error `npm ERR! argv "node" "/usr/local/bin/npm" "install" "-g" "origami-build-tools"`

> This error should be fixed in v3.0.2 of origami-build-tools, but we're keeping it in this troubleshooting guide for now.

When install origami-build-tools, depending on the version of [npm](https://github.com/npm/npm), it might fail with an error similar to this:

>npm ERR! Darwin 14.3.0
>npm ERR! argv "node" "/usr/local/bin/npm" "install" "-g" "origami-build-tools"
>npm ERR! node v0.12.4
>npm ERR! npm  v2.11.1
>npm ERR! path /usr/local/lib/node_modules/origami-build-tools/node_modules/gulp-lintspaces/node_modules/lintspaces/node_modules/editorconfig/bin\editorconfig
>npm ERR! code ENOENT
>npm ERR! errno -2
>
>npm ERR! enoent ENOENT, chmod '/usr/local/lib/node_modules/origami-build-tools/node_modules/gulp-lintspaces/node_modules/lintspaces/node_modules/editorconfig/bin\editorconfig'
>npm ERR! enoent This is most likely not a problem with npm itself
>npm ERR! enoent and is related to npm not being able to find a file.
>npm ERR! enoent

There was bug with some versions of [npm](https://github.com/npm/npm) and [EditorConfig](https://github.com/editorconfig/editorconfig-core-js). To fix it, try updating to the latest npm by running:

```bash
npm install -g npm
```

## `install`

### Installing Ruby

* Macs typically ship with Ruby by default, but:
	- If you get a `Gem::FilePermissionError` error, you need to [install a ruby version manager](http://stackoverflow.com/questions/19579392/installing-gem-fails-with-permissions-error).
	- To [install rbenv](https://github.com/sstephenson/rbenv#homebrew-on-mac-os-x) you first need to [install homebrew](http://brew.sh/).
	- Once you've installed rbenv you need to [install ruby](https://github.com/sstephenson/rbenv/#installing-ruby-versions).
		- Note: rbenv needs a bit of post-install setup. If you install with homebrew, also do steps 2 and 3 of the [Basic GitHub Checkout](https://github.com/sstephenson/rbenv/#basic-github-checkout) section.

### Error `Unable to download data from https://rubygems.org/`

If you receive an error specifying `Unable to download data from https://rubygems.org/ - SSL_connect returned=1 errno=0 state=SSLv3 read server certificate B: certificate verify failed (https://api.rubygems.org/specs.4.8.gz)` you'll need to manually update your gem package using the directions in [this gist](https://gist.github.com/luislavena/f064211759ee0f806c88).

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

This can be fixed by following one of the methods suggested in the [official guide](https://docs.npmjs.com/getting-started/fixing-npm-permissions).

### Warning `Origami registry is not configured in a .bowerrc file`

Origami modules are listed on Origami's custom Bower registry, and aren't available to the global, public one. Custom registries can be added to a `.bowerrc` configuration file located in your home directory. To create a `.bowerrc` configuration file now, run::

```bash
echo '{"registry":{"search":["http://registry.origami.ft.com","https://bower.herokuapp.com"]}}' > ~/.bowerrc
```

### Error `fatal: unable to connect to github.com"`

This can happen if the git protocol is blocked on your network. To get around this you can use the http instead:

```bash
echo -e '[url "http://"]\n    insteadOf = git://' >> ~/.gitconfig
