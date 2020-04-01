/* eslint-env mocha */
'use strict';

const execa = require('execa');
const path = require('path');
const process = require('process');
const proclaim = require('proclaim');
const obtBinPath = require('../helpers/obtpath');
const fileExists = require('../helpers/fileExists');
const rimraf = require('../helpers/delete');
const vm = require('vm');
const fs = require('fs');
const isEs5 = require('is-es5-syntax');
const currentVersion = require('node-version');

describe('obt build', function () {

	this.timeout(60 * 1000);

	describe('js builds', function () {
		describe('component with no js', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/no-js-or-sass'));
			});

			afterEach(function () {
				// Change the current working directory back to the directory where you started running these tests from.
				process.chdir(process.cwd());
			});

			it('should not error', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['build']);
					});
			});
		});

		describe('component with invalid js', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/js-invalid'));
			});

			afterEach(function () {
				// Change the current working directory back to the directory where you started running these tests from.
				process.chdir(process.cwd());
			});

			it('should error', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['build']);
					})
					.then(() => {
						throw new Error('obt build should error when trying to build a dependency which has invalid js.');
					}, () => {
						// obt build exited with a non-zero exit code, which is what we expected.
					});
			});
		});

		describe('component with valid ES5 js', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/js-es5'));
			});

			afterEach(function () {
				return rimraf(path.join(process.cwd(), '/build'))
					.then(() => process.chdir(process.cwd()));
			});

			it('should build js', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['build']);
					})
					.then(() => {
						return fileExists('build/main.js');
					})
					.then(exists => {
						proclaim.ok(exists);
					})
					.then(() => {
						const code = fs.readFileSync('build/main.js', 'utf-8');

						proclaim.isTrue(isEs5(code));

						const sandbox = {self: {}};

						const script = new vm.Script(code);

						const context = new vm.createContext(sandbox); // eslint-disable-line new-cap
						script.runInContext(context);
						proclaim.deepEqual(sandbox, { self: {world: 2 }});
					});
			});
		});

		describe('component with valid ES6 js', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/js-es6'));
			});

			afterEach(function () {
				return rimraf(path.join(process.cwd(), '/build'))
					.then(() => process.chdir(process.cwd()));
			});

			it('should build js', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['build']);
					})
					.then(() => {
						return fileExists('build/main.js');
					})
					.then(exists => {
						proclaim.ok(exists);
					})
					.then(() => {
						const code = fs.readFileSync('build/main.js', 'utf-8');

						proclaim.isTrue(isEs5(code));

						const sandbox = {self: {}};

						const script = new vm.Script(code);

						const context = new vm.createContext(sandbox); // eslint-disable-line new-cap
						script.runInContext(context);
						proclaim.deepEqual(sandbox, { self: {world: 2 }});
					});
			});
		});

		describe('component with valid ES7 js', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/js-es7'));
			});

			afterEach(function () {
				return rimraf(path.join(process.cwd(), '/build'))
					.then(() => process.chdir(process.cwd()));
			});

			it('should build js', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['build']);
					})
					.then(() => {
						return fileExists('build/main.js');
					})
					.then(exists => {
						proclaim.ok(exists);
					})
					.then(() => {
						const code = fs.readFileSync('build/main.js', 'utf-8');

						proclaim.isTrue(isEs5(code));

						const sandbox = {self: {}};

						const script = new vm.Script(code);

						const context = new vm.createContext(sandbox); // eslint-disable-line new-cap
						script.runInContext(context);
						proclaim.deepEqual(sandbox, { self: {world: 100} });
					});
			});
		});

		describe('component using npm dependency\'s js', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/js-npm-dependency'));
			});

			afterEach(function () {
				return rimraf(path.join(process.cwd(), '/build'))
					.then(() => rimraf(path.join(process.cwd(), '/node_modules')))
					.then(() => process.chdir(process.cwd()));
			});

			it('should build js', function () {
				let obt;
				return obtBinPath()
					.then(obtPath => {
						obt = obtPath;
						return execa(obt, ['install']);
					})
					.then(() => {
						return execa(obt, ['build', '--ignore-bower']);
					})
					.then(() => {
						return fileExists('build/main.js');
					})
					.then(exists => {
						proclaim.ok(exists);
					})
					.then(() => {

						const code = fs.readFileSync('build/main.js', 'utf-8');

						proclaim.isTrue(isEs5(code));

						const sandbox = {self: {}};

						const script = new vm.Script(code);

						const context = new vm.createContext(sandbox); // eslint-disable-line new-cap
						script.runInContext(context);
						proclaim.deepEqual(sandbox.self, { world: 'fooBar' });
					});
			});
		});

		describe('component using npm dependency\'s ES7 js', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/js-npm-dependency-es7'));
				return rimraf(path.join(process.cwd(), '/build'));
			});

			afterEach(function () {
				return rimraf(path.join(process.cwd(), '/build'))
					.then(() => process.chdir(process.cwd()));
			});

			it('should compile the dependency js', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['build', '--ignore-bower']);
					})
					.then(() => {
						return fileExists('build/main.js');
					})
					.then(exists => {
						proclaim.ok(exists);
					})
					.then(() => {
						const code = fs.readFileSync('build/main.js', 'utf-8');

						proclaim.isTrue(isEs5(code));

						if (currentVersion.major >= 7) {
							const sandbox = {self: {}};

							const script = new vm.Script(code);
							const context = new vm.createContext(sandbox); // eslint-disable-line new-cap
							script.runInContext(context);
							proclaim.deepEqual(sandbox.self, { world: 100 });
						}
					});
			});
		});

		describe('component using bower dependency\'s js', function () {
			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/js-bower-dependency'));
			});

			afterEach(function () {
				return rimraf(path.join(process.cwd(), '/build'))
					.then(() => rimraf(path.join(process.cwd(), '/bower_components')))
					.then(() => process.chdir(process.cwd()));
			});

			it('should build js', function () {
				let obt;
				return obtBinPath()
					.then(obtPath => {
						obt = obtPath;
						return execa(obt, ['install']);
					})
					.then(() => {
						return execa(obt, ['build']);
					})
					.then(() => {
						return fileExists('build/main.js');
					})
					.then(exists => {
						proclaim.ok(exists);
					})
					.then(() => {
						const code = fs.readFileSync('build/main.js', 'utf-8');

						proclaim.isTrue(isEs5(code));

						const sandbox = {self: {}};

						const script = new vm.Script(code);

						const context = new vm.createContext(sandbox); // eslint-disable-line new-cap
						script.runInContext(context);
						proclaim.deepEqual(sandbox.self, { word: 'Hello world.' });
					});
			});
		});

		describe('component using bower dependency\'s ES6 js', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/js-bower-dependency-es6'));
			});

			afterEach(function () {
				return rimraf(path.join(process.cwd(), '/build'))
					.then(() => rimraf(path.join(process.cwd(), '/bower_components')))
					.then(() => process.chdir(process.cwd()));
			});

			it('should build js', function () {
				let obt;
				return obtBinPath()
					.then(obtPath => {
						obt = obtPath;
						return execa(obt, ['install']);
					})
					.then(() => {
						return execa(obt, ['build']);
					})
					.then(() => {
						return fileExists('build/main.js');
					})
					.then(exists => {
						proclaim.ok(exists);
					})
					.then(() => {
						const code = fs.readFileSync('build/main.js', 'utf-8');

						proclaim.isTrue(isEs5(code));

						const sandbox = {self: {}};

						const script = new vm.Script(code);

						const context = new vm.createContext(sandbox); // eslint-disable-line new-cap
						script.runInContext(context);
						proclaim.isFunction(sandbox.self.world);
					});
			});
		});

		describe('component using bower dependency\'s ES7 js', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/js-bower-dependency-es7'));
			});

			afterEach(function () {
				return rimraf(path.join(process.cwd(), '/build'))
					.then(() => process.chdir(process.cwd()));
			});

			it('should build js', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['build']);
					})
					.then(() => {
						return fileExists('build/main.js');
					})
					.then(exists => {
						proclaim.ok(exists);
					})
					.then(() => {
						const code = fs.readFileSync('build/main.js', 'utf-8');

						proclaim.isTrue(isEs5(code));

						const sandbox = {self: {}};

						const script = new vm.Script(code);

						const context = new vm.createContext(sandbox); // eslint-disable-line new-cap
						script.runInContext(context);
						proclaim.deepEqual(sandbox.self, { world: 100 });
					});
			});
		});
	});

	describe('sass builds', function () {
		describe('component with no sass', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/no-js-or-sass'));
			});

			afterEach(function () {
				// Change the current working directory back to the directory where you started running these tests from.
				process.chdir(process.cwd());
			});

			it('should not error', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['build']);
					});
			});
		});

		describe('component with invalid sass', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/sass-invalid'));
			});

			afterEach(function () {
				// Change the current working directory back to the directory where you started running these tests from.
				process.chdir(process.cwd());
			});

			it('should error', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['build']);
					})
					.then(() => {
						throw new Error('obt build should error when trying to build a dependency which has invalid sass.');
					}, () => {
						// obt build exited with a non-zero exit code, which is what we expected.
					});
			});
		});

		describe('component with valid sass', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/sass'));
			});

			afterEach(function () {
				return rimraf(path.join(process.cwd(), '/build'))
					.then(() => process.chdir(process.cwd()));
			});

			it('should build sass', function () {
				return obtBinPath()
					.then(obt => {
						return execa(obt, ['build']);
					})
					.then(() => {
						return fileExists('build/main.css');
					})
					.then(exists => {
						proclaim.ok(exists);
					})
					.then(() => {
						proclaim.deepEqual(fs.readFileSync('build/main.css', 'utf-8'), `.o-test {
  font-size: 18px;
  display: -ms-grid;
  display: grid;
  -ms-grid-columns: 1fr 1fr;
  grid-template-columns: 1fr 1fr;
  -ms-grid-rows: 1fr;
  grid-template-rows: 1fr;
}
.o-test--error {
  background-color: red;
  color: white;
}

.test__content {
  -ms-grid-column: 1;
  -ms-grid-column-span: 2;
  grid-column: 1/span 2;
  -ms-grid-row: 1;
  grid-row: 1;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  -ms-grid-row-align: center;
  align-self: center;
}

.test__visual {
  -ms-grid-row: 1;
  grid-row: 1;
}
/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRhdGE6O2NoYXJzZXQ9dXRmLTgsJHN5c3RlbS1jb2RlOiUyMCUyMm9yaWdhbWktYnVpbGQtdG9vbHMlMjI7QG1peGluJTIwb1Rlc3RDb21wb25lbnQoKSUyMCU3QiUwQSUwOS5vLXRlc3QlMjAlN0IlMEElMDklMDlmb250LXNpemU6JTIwMThweDslMEElMDklMDlkaXNwbGF5OiUyMGdyaWQ7JTBBJTA5JTA5Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiUyMDFmciUyMDFmcjslMEElMDklMDlncmlkLXRlbXBsYXRlLXJvd3M6JTIwMWZyOyUwQSUwOSUwOSYtLWVycm9yJTIwJTdCJTBBJTA5JTA5JTA5YmFja2dyb3VuZC1jb2xvcjolMjByZWQ7JTBBJTA5JTA5JTA5Y29sb3I6JTIwd2hpdGU7JTBBJTA5JTA5JTdEJTBBJTA5JTdEJTBBJTA5LnRlc3RfX2NvbnRlbnQlMjAlN0IlMEElMDklMDlncmlkLWNvbHVtbjolMjAxJTIwLyUyMHNwYW4lMjAyOyUwQSUwOSUwOWdyaWQtcm93OiUyMDE7JTBBJTA5JTA5Ym94LXNpemluZzolMjBib3JkZXItYm94OyUwQSUwOSUwOWFsaWduLXNlbGY6JTIwY2VudGVyOyUwQSUwOSU3RCUwQSUwOS50ZXN0X192aXN1YWwlMjAlN0IlMEElMDklMDlncmlkLXJvdzolMjAxOyUwQSUwOSU3RCUwQSU3RCUwQSUwQUBpbmNsdWRlJTIwb1Rlc3RDb21wb25lbnQ7JTBBIiwibWFpbi5zY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNDO0VBQ0MsZUFBQTtFQUNBLGlCQUFBO0VBQUEsYUFBQTtFQUNBLHlCQUFBO0VBQUEsOEJBQUE7RUFDQSxrQkFBQTtFQUFBLHVCQUFBO0FDQUY7QURDRTtFQUNDLHFCQUFBO0VBQ0EsWUFBQTtBQ0NIOztBREVDO0VBQ0Msa0JBQUE7RUFBQSx1QkFBQTtFQUFBLHFCQUFBO0VBQ0EsZUFBQTtFQUFBLFdBQUE7RUFDQSw4QkFBQTtFQUFBLHNCQUFBO0VBQ0EsMEJBQUE7RUFBQSxrQkFBQTtBQ0NGOztBRENDO0VBQ0MsZUFBQTtFQUFBLFdBQUE7QUNFRiIsImZpbGUiOiJtYWluLmNzcyJ9 */`);
					});
			});
		});

		describe('component using bower dependency\'s sass', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/sass-bower-dependency'));
			});

			afterEach(function () {
				return rimraf(path.join(process.cwd(), '/build'))
					.then(() => rimraf(path.join(process.cwd(), '/bower_components')))
					.then(() => process.chdir(process.cwd()));
			});

			it('should build sass', function () {
				let obt;
				return obtBinPath()
					.then(obtPath => {
						obt = obtPath;
						return execa(obt, ['install']);
					})
					.then(() => {
						return execa(obt, ['build']);
					})
					.then(() => {
						return fileExists('build/main.css');
					})
					.then(exists => {
						proclaim.ok(exists);
					})
					.then(() => {
						proclaim.deepEqual(fs.readFileSync('build/main.css', 'utf-8'), `#test-compile-error {
  color: red;
}
/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvamFrZS5jaGFtcGlvbi9Db2RlL29yaWdhbWktYnVpbGQtdG9vbHMvdGVzdC9pbnRlZ3JhdGlvbi9idWlsZC9maXh0dXJlcy9zYXNzLWJvd2VyLWRlcGVuZGVuY3kvYm93ZXJfY29tcG9uZW50cy9vLXRlc3QtY29tcG9uZW50L21haW4uc2NzcyIsIm1haW4uc2NzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtFQUNDLFVBQUE7QUNBRCIsImZpbGUiOiJtYWluLmNzcyJ9 */`);
					});
			});
		});

		describe('component using npm dependency\'s sass', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/sass-npm-dependency'));
			});

			afterEach(function () {
				return rimraf(path.join(process.cwd(), '/build'))
					.then(() => rimraf(path.join(process.cwd(), '/node_modules')))
					.then(() => process.chdir(process.cwd()));
			});

			it('should not compile sass which uses files in node_modules directory', function () {
				let obt;
				return obtBinPath()
					.then(obtPath => {
						obt = obtPath;
						return execa(obt, ['install']);
					})
					.then(() => {
						return execa(obt, ['build']);
					})
					.then(() => {
						throw new Error('obt build should error when trying to build sass which uses files in node_modules directory.');
					}, () => {
						// obt build exited with a non-zero exit code, which is what we expected.
					});
			});
		});
	});
});
