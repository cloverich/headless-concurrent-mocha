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

  constructor(private tests: Array<TestInput>, private concurrency: number) { }

  async run() {
    console.log('\n', chalk.cyan('Beginning tests'), '\n');
    this.browser = await launch();

    // Don't start more workers than there are jobs
    const workerCount = Math.min(this.concurrency, this.tests.length);

    // Start work
    const workersList = _.range(workerCount).map(i => this.worker(i, this.tests.pop(), this.tests, []));

    // As it completes, each worker returns an array of failed tests
    const testFails = await Promise.all(workersList).then(failLists => _.flatten(failLists));
    this.browser.close();

    reportFails(testFails);

    // TODO: Return more info: passes, failures, totals
    return testFails.length;
  }

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

  private runTest = async (test: TestInput): Promise<TestFails> => {
    const htmlTestfileName = path.resolve(__dirname, `template.html`);
    const page = await this.browser.newPage();
    let testFails;

    page.on('console', async ({ type, text, args }) => {
      let report;

      try {
        const parsed = await Promise.all(args.map(a => a.jsonValue()));
        if (parsed[0] === 'TEST_OUTPUT') {
          report = JSON.parse(parsed[1]);
        } else {
          if (ENABLE_CONSOLE) console.log(text);
        }
      } catch (err) {
        if (ENABLE_CONSOLE) console.log(text);
      }

      if (report) {
        testFails = reportTests(test.entry, report);
      }
    });

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

    // TODO: can page.evaluateHandle be used to get the test result data, and
    // avoid the console logic above all together?

    await page.waitForFunction(() => (window as any).__MOCHA_RESULT__);
    await page.close();

    // TODO: Validate here
    if (!testFails) throw new Error(`Error collecting test results from ${test.entry}`);

    return testFails;
  }
}
