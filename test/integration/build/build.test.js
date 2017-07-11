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
						return Promise.reject(new Error('obt build should error when trying to build a dependency which has invalid js.'));
					}, () => {
						return Promise.resolve(); // obt build exited with a non-zero exit code, which is what we expected.
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

						const sandbox = {};

						const script = new vm.Script(code);

						const context = new vm.createContext(sandbox); // eslint-disable-line new-cap
						script.runInContext(context);
						proclaim.deepEqual(sandbox, { world: 2 });
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

						const sandbox = {};

						const script = new vm.Script(code);

						const context = new vm.createContext(sandbox); // eslint-disable-line new-cap
						script.runInContext(context);
						proclaim.deepEqual(sandbox, { world: 2 });
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

						const sandbox = {};

						const script = new vm.Script(code);

						const context = new vm.createContext(sandbox); // eslint-disable-line new-cap
						script.runInContext(context);
						proclaim.deepEqual(sandbox, { world: 100 });
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

						const sandbox = {};

						const script = new vm.Script(code);

						const context = new vm.createContext(sandbox); // eslint-disable-line new-cap
						script.runInContext(context);
						proclaim.deepEqual(sandbox, { world: 'fooBar' });
					});
			});
		});

		describe('component using npm dependency\'s ES7 js', function () {

			beforeEach(function () {
				// Change the current working directory to the folder which contains the project we are testing against.
				// We are doing this to replicate how obt is used when executed inside a terminal.
				process.chdir(path.join(__dirname, '/fixtures/js-npm-dependency-es7'));
				return rimraf(path.join(process.cwd(), '/build'))
					.then(() => rimraf(path.join(process.cwd(), '/node_modules')));
			});

			afterEach(function () {
				return rimraf(path.join(process.cwd(), '/build'))
					.then(() => rimraf(path.join(process.cwd(), '/node_modules')))
					.then(() => process.chdir(process.cwd()));
			});

			it('should compile the dependency js using babel', function () {
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

						if (currentVersion.major >= 7) {
							const sandbox = {};

							const script = new vm.Script(code);
							const context = new vm.createContext(sandbox); // eslint-disable-line new-cap
							script.runInContext(context);
							proclaim.deepEqual(sandbox, { world: 100 });
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

						const sandbox = {};

						const script = new vm.Script(code);

						const context = new vm.createContext(sandbox); // eslint-disable-line new-cap
						script.runInContext(context);
						proclaim.deepEqual(sandbox, { world: 'fooBar' });
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

						const sandbox = {};

						const script = new vm.Script(code);

						const context = new vm.createContext(sandbox); // eslint-disable-line new-cap
						script.runInContext(context);
						proclaim.deepEqual(sandbox, { world: 2 });
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

						const sandbox = {};

						const script = new vm.Script(code);

						const context = new vm.createContext(sandbox); // eslint-disable-line new-cap
						script.runInContext(context);
						proclaim.deepEqual(sandbox, { world: 100 });
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
						return Promise.reject(new Error('obt build should error when trying to build a dependency which has invalid sass.'));
					}, () => {
						return Promise.resolve(); // obt build exited with a non-zero exit code, which is what we expected.
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
  font-size: 18px; }
  .o-test--error {
    background-color: red;
    color: white; }
/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0ZGluIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNDO0VBQ0MsZ0JBQWUsRUFNZjtFQUpBO0lBQ0Msc0JBQXFCO0lBQ3JCLGFBQVksRUFDWiIsImZpbGUiOiJtYWluLmNzcyJ9 */`);
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
  color: red; }
/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJvd2VyX2NvbXBvbmVudHMvby10ZXN0LWNvbXBvbmVudC9tYWluLnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFDQyxXQUFVLEVBQ1YiLCJmaWxlIjoibWFpbi5jc3MifQ== */`);
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
						return Promise.reject(new Error('obt build should error when trying to build sass which uses files in node_modules directory.'));
					}, () => {
						return Promise.resolve(); // obt build exited with a non-zero exit code, which is what we expected.
					});
			});
		});
	});
});
