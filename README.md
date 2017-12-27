# Headless chrome + mocha + react + typescript
An example project setup for running mocha tests in chrome headless.

You can checkout and run this project with:

```sh
npm install
npm test
```

## Goal
This is a proof of concept for:
- running mocha tests
- with webpack, react, typescript
- in chrome headless (without karma or jsdom)
- concurrently

I have a few projects that are using Mocha, React, Typescript, and Webpack. I started this project to see how difficult it would be to run those mocha tests concurrently (each _file_ in a separate process) in [chrome headless][2]. Moreoever, I want access to a real browser DOM in my tests and want to avoid Karma. In short, I want to have a test like this:

```js
describe('A basic test', function () {
  let element: HTMLDivElement;

  before('setup', function () {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  after('teardown', function () {
    ReactDOM.unmountComponentAtNode(element);
    document.body.removeChild(element);
  });

  it('renders', function () {
    ReactDOM.render(<Greeting name="world" />, element);
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

## Code overview
- Compile each test file into an independent test output file
- Launch chrome headless and one or more tabs
- Inject mocha and a test file into each tab
- Use a custom mocha-reporter in each tab to _collect_ test results
- Pass _completed test results_ from each file to reporter
- Print out a final report on number of passes and failures

A few noteworthy points about this setup.

1. Test files are compiled from multiple test input files into multiple test output files, rather than a single test bundle. Webpack's `entry` configuration can run asynchronously, allowing us to find all test files dynamically:

```ts
  // webpack.config.ts

  entry: async (): Promise<any> => {
    const { stdout } = await execa('find', ['src', '-type', 'f', '-name', '*.spec.*']);
    const testfiles = stdout.split('\n');

    return testfiles.reduce((entryMap: EntryMap, filename: string) => {
      const source = path.resolve(__dirname, '..', filename);

      entryMap[filename] = source;
      return entryMap;
    }, {});
  },

```


2. Test file's and dependencies are loaded into tabs on demand

```ts
  // runner.ts

  const page = await this.browser.newPage();
  // ...
  await page.addScriptTag({
    path: path.resolve(__dirname, '../node_modules/mocha/mocha.js')
  })

  await page.evaluate(createMochaReporter);

  for (const bundle of test.bundles) {
    await page.addScriptTag({
      path: bundle,
    })
  }

  await page.evaluate(runMocha);
```

This could be extended to load test from memory (instead of output files), or to use different test frameworks via configuration.


3. Mocha expects to run all tests to completion and report as it goes. Because we want to run each test file in isolation, in parallel, and not output test results from different suites at the same time, we use two custom reporters:
  - `mocha-reporter.js` is injected into the browser, and _collects_, rather than prints out, test results as they run
  - `local-reporter.ts` prints out the collected results, styled similar to mocha's `spec` reporter.
  - `runner.ts` coordinates passing the collected results from `mocha-reporter.js` to `local-reporter.ts`. `mocha-reporter.js` stores test results `window.__TEST_RESULT__` so they can be accessed when complete:

  ```ts
    // runner.ts

    await page.waitForFunction(() => (window as any).__TEST_RESULT__);
    const resultHandle = await page.evaluateHandle(() => (window as any).__TEST_RESULT__);
    const testResults = await resultHandle.jsonValue() as MochaRunResult;
    // ...

    reportTests(test.entry, testResults);
  ```

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