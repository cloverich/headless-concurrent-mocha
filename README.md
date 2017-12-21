# Headless chrome + mocha + react + typescript
An example project setup for running mocha tests in chrome headless.

## Goal
This is a proof of concept for:
- running mocha tests
- with webpack, react, typescript
- in chrome headless (without karma or jsdom)
- concurrently

I have a few projects that are using Mocha, React, Typescript, and Webpack. I started this project to see how difficult it would be to run those mocha tests concurrently (each _file_ in a separate process) in [chrome headless][2]. Moreoever, I want access to a real browser DOM in my tests and want to avoid Karma. In short, I want to have a test like this:

```js
describe('A basic test', function () {
  let node: HTMLDivElement;

  before('setup', function () {
    node = document.createElement('div');
    document.body.appendChild(node);
  });

  after('teardown', function () {
    ReactDOM.unmountComponentAtNode(node);
    document.body.removeChild(node);
  });

  it('renders', function () {
    ReactDOM.render(<Greeting name="world" />, node);
    const intro = document.querySelector('.Greeting');
    expect(intro).to.exist;
    expect(intro!.textContent).to.contain('Hello, world');
  });
});
```

## Motivation
At the time of writing (dec 2017):
- mocha is the [most popular testing framework][6]
- mocha test's run in the browser but with little built-in tooling and [no concurrency][8]
- karma solves the browser and concurrency issue, but requires configuration and regular troubleshooting ([example][10])
- jest provides excellent tooling and active development but [no browser support, yet][7]

I found Karma to be confusing to set-up and difficult to debug / maintain, and wasn't ready to migrate my existing projects to Jest. I suspected manually setting up chrome headless w/ pupeteer would be a small amount of work for existing mocha and webpack projects and wanted to validate that hypothesis.

## Status
- [x] Basic react app
- [x] Compile test files w/ webpack
- [x] support nested tests co-located w/ source files
- [x] run all tests in chrome headless
- [x] produce non-zero exit on test failure
- [x] use custom mocha reporter's to collect and report mocha test results
- [x] produce readable test output
- [x] run tests concurrently (file based)
- [x] all test code in typescript

You can checkout and run this project with:

```sh
npm install
npm test
```

## Architecture (todo)
- Directories:
  - The `/src` directory contains the basic react application. Tests are co-located with components in  `__tests__` folders, similar to Jest's default setup.
  - The `/test` directory contains all the code used to compile, load, run, and report test results
- Tests are compiled using `find` -> webpack.
  - Importantly, the setup uses [CommonsChunkPlugin][5] to prevent re-bundling the same code repeatedly
- Mocha reporting
  - Mocha reporters print out mocha tests results as they run. Because we're running tests in a separate process and concurrently, this project uses a custom reporter that collects the test output in the browser, then provides it to the node process where it is printed to console.
- Running in chrome.
  - After webpack compiles, we gather an array of test files from its output.
  - We spin up tabs in a chrome-headless instance using [puppeteer][3] and iteratively pass them off to each tab
  - Test files are dynamically injected into a nearly empty template html file by each tab, and results are collected and printed to the console

## Links
- A fantastic overview of [Javascript Testing in 2017][1]
- [Jest with puppeteer][4] and [when will Jest target more than JSDOM][7]
- Use chrome headless from node with [Puppeteer][3]
- An example project running [mocha tests in chrome][9] that i used for inspiration.
- Mocha doesn't have plans for [supporting concurrent test runs][8]

[1]: https://medium.com/powtoon-engineering/a-complete-guide-to-testing-javascript-in-2017-a217b4cd5a2a
[2]: https://developers.google.com/web/updates/2017/04/headless-chrome
[3]: https://github.com/GoogleChrome/puppeteer
[4]: http://facebook.github.io/jest/docs/en/puppeteer.html
[5]: https://webpack.js.org/plugins/commons-chunk-plugin/
[6]: https://stateofjs.com/2017/testing/results
[7]: https://github.com/facebook/jest/issues/848
[8]: https://github.com/mochajs/mocha/issues/1499
[9]: https://github.com/direct-adv-interfaces/mocha-headless-chrome
[10]: https://gitlab.com/gitlab-org/gitlab-ce/issues/33784