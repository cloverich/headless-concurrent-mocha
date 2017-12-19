import chalk from 'chalk';
import { launch, Browser } from 'puppeteer';
import * as _ from 'lodash';
import * as path from 'path';
import { reportTests, reportFails, TestFails, TestResult } from './local-reporters';
const { createMochaReporter, runMocha } = require('./mocha-reporter');
import { TestInput } from './';

const ENABLE_CONSOLE = process.env.ENABLE_BROWSER_CONSOLE || false;
const DEBUG_WORKERS = process.env.DEBUG_WORKERS || false;

/**
 * chrome - its using chrome headless
 * mocha - its got mocha-specific logic
 * runner - it runs the tests
 */
export class ChromeMochaRunner {
  browser: Browser;

  /**
   *
   * @param tests - Array of test files to run
   * @param concurrency - Number of tabs to run tests in
   */
  constructor(private tests: Array<TestInput>, private concurrency: number) { }

  async run() {
    console.log('\n', chalk.cyan('Beginning tests'), '\n');
    this.browser = await launch();

    // Don't start more workers than there are jobs
    const workerCount = Math.min(this.concurrency, this.tests.length);

    // Start work
    const workersList = _.range(workerCount).map(i => this.worker(i, this.tests.pop(), this.tests, []));

    // As it completes, each worker returns an array of failed tests
    const testFails = await Promise.all(workersList).then(_.flatten);
    this.browser.close();

    reportFails(testFails);

    // TODO: Return more info: passes, failures, totals
    return testFails.length;
  }

  /**
   * Recursively run tests until there are no more.
   * TODO: Better name,
   */
  private worker = async (
    workerId: number,
    job: TestInput | undefined,
    tests: Array<TestInput>,
    fails: Array<TestResult>
  ): Promise<TestFails> => {

    if (!job) {
      if (DEBUG_WORKERS) console.log(chalk.cyan(`\nWorker #${workerId} terminating`));
      return fails;
    }

    if (DEBUG_WORKERS) console.log(chalk.cyan(`\nWorker #${workerId} starting ${job}`));
    fails = fails.concat(await this.runTest(job));
    if (DEBUG_WORKERS) console.log(chalk.cyan(`\nWorker #${workerId} completed ${job}`));

    return this.worker(workerId, tests.pop(), tests, fails)
  }

  /**
   * Spawn a tab, load the test, and report its results.
   */
  private runTest = async (test: TestInput): Promise<TestFails> => {
    const htmlTestfileName = path.resolve(__dirname, `template.html`);
    const page = await this.browser.newPage();

    if (ENABLE_CONSOLE) {
      page.on('console', async ({ type, text, args }) => {
        (console as any)[type](text);
      });
    }

    // NOTE: This won't handle new pages or tabs being opened, etc.
    // But that could be added.
    page.on('dialog', (dialog: any) => dialog.close());
    page.on('pageerror', console.error);

    await page.goto('file:///' + htmlTestfileName);
    await page.addScriptTag({
      path: path.resolve(__dirname, '../node_modules/mocha/mocha.js')
    })

    await page.evaluate(createMochaReporter);

    // NOTE: This assumes the files are always ordered so dependent files are loaded last,
    // e.g. the common bundle containing React is loaded before the test file that uses
    // React.
    for (const bundle of test.bundles) {
      await page.addScriptTag({
        path: bundle,
      })
    }

    await page.evaluate(runMocha);

    // Await window.__TEST_RESULT__, a variable populated by our custom mocha reporter
    // (mocha-reporter.js) when the test run completes.
    await page.waitForFunction(() => (window as any).__TEST_RESULT__);
    const resultHandle = await page.evaluateHandle(() => (window as any).__TEST_RESULT__);
    const testResults = await resultHandle.jsonValue();
    await resultHandle.dispose();
    await page.close();

    const testFails = reportTests(test.entry, testResults);
    if (!testFails) throw new Error(`Error collecting test results from ${test.entry}`);

    return testFails;
  }
}
