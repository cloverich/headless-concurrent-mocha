const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const execa = require('execa');
const _ = require('lodash');
const puppeteer = require('puppeteer');
const chalk = require('chalk');

const config = require('./webpack.config');
const { reportFails, reportTests } = require('./reporters');

// TODO: Paramaterize
const ENABLE_CONSOLE = false;
const DEBUG_WORKERS = false;

async function getTestFilenames() {
  const { stdout } = await execa('find', ['src', '-type', 'f', '-name', '*.spec.*']);
  const testfiles = stdout.split('\n');

  return testfiles.reduce((entryMap, filename) => {
    // key will be output filename, value is where to find the source
    // todo: leave key as a nested file. Its more obvious what's happening.
    entryMap[filename.replace(/\//g, '_')] = path.resolve(__dirname, '..', filename);
    return entryMap;
  }, {});
}

async function run() {
  const entry = await getTestFilenames();
  const testfiles = Object.keys(entry);

  config.entry = entry;

  // TODO: Here we're generating a test html file for each test. Instead, use a single template
  // and inject the needed elements on demand
  // https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pageaddscripttagoptions
  config.plugins.push(...testfiles.map(filename => {
    return new HtmlWebpackPlugin({
      inject: false,
      title: filename,
      chunks: ['common', filename],
      filename: `${filename}.html`,
      // Default is relative to context, which is source directory
      // re-direct to the test directory
      template: '../test/template.html',
    })
  }));

  console.log(chalk.cyan('Beginning webpack build'), '\n');

  webpack(config, async (err, stats) => {
    if (err) {
      console.error(err);
      return;
    }

    // Print out minimal information about what was bundled.
    console.log(stats.toString({
      chunks: false,
      colors: true,
      children: false,
      modules: false,
    }));

    const testFails = await startWorkers(4, testfiles);
    reportFails(testFails);

    // Non-zero exit if any tests failed
    process.exit(testFails.length);
  });
}


async function startWorkers(concurrentWorkers, jobs) {
  console.log('\n', chalk.cyan('Beginning tests'), '\n');
  const browser = await puppeteer.launch();

  // Don't start more workers than there are jobs
  const workerCount = Math.min(concurrentWorkers, jobs.length);

  // Start work
  const workersList = _.range(workerCount).map(i => handleTest(i, jobs.pop(), jobs, [], browser));

  // As it completes, each worker returns an array of failed tests
  const testFails = await Promise.all(workersList).then(failLists => _.flatten(failLists));
  browser.close();
  return testFails;
}

async function handleTest(workerId, job, jobs, fails, browser) {
  if (!job) {
    if (DEBUG_WORKERS) console.log(chalk.cyan(`\nWorker #${workerId} terminating`));
    return fails;
  }

  if (DEBUG_WORKERS) console.log(chalk.cyan(`\nWorker #${workerId} starting ${job}`));
  fails = fails.concat(await runTest(job, browser));
  if (DEBUG_WORKERS) console.log(chalk.cyan(`\nWorker #${workerId} completed ${job}`));

  return handleTest(workerId, jobs.pop(), jobs, fails, browser)
}

async function runTest(testfile, browser) {
  const fullname = path.resolve(__dirname, 'lib', `${testfile}.html`);
  const page = await browser.newPage();
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
      testFails = reportTests(testfile, report);
    }
  });

  page.on('dialog', dialog => dialog.close());
  page.on('pageerror', console.error);

  await page.goto('file:///' + fullname);
  await page.waitForFunction(() => window.__MOCHA_RESULT__);
  await page.close();

  // TODO: Validate here
  return testFails;
}


// interface Stats {
//   tests: number;
//   passes: number;
//   pending: number;
//   failures: number;
//   start: string; // ISO8601
//   end: string; // ISO8601
//   duration: number;
// }

// interface TestResult {
//   title: string;
//   fullTitle: string; // space concatenated from parent suite titles
//   duration: number;
//   err: Error | {}; // instead of null, it returns an empty object :(
// }

// interface TestError {
//   message: string;
//   showDiff: boolean;
//   actual: any;
//   expected: any;
//   stack: string;
// }

// interface Result {
//   stats: Stats;
//   tests: Array<TestResult>;
//   pending: Array<TestResult>;
//   failures: Array<TestResult>;
//   passes: Array<TestResult>;
// }

run();