import * as webpack from 'webpack'; //const webpack = require('webpack');
import * as path from 'path';
import * as execa from 'execa';
import * as _ from 'lodash';
import { launch, Browser } from 'puppeteer';
import chalk from 'chalk';

import { config } from './webpack.config';
import { reportFails, reportTests, TestResult, TestFails } from './reporters';
// import { runMocha } from './mocha-reporter';
const { createMochaReporter, runMocha } = require('./mocha-reporter');

// TODO: Paramaterize
const ENABLE_CONSOLE = false;
const DEBUG_WORKERS = false;

interface EntryMap {
  [key: string]: string;
}


async function getTestFilenames(): Promise<EntryMap> {
  const { stdout } = await execa('find', ['src', '-type', 'f', '-name', '*.spec.*']);
  const testfiles = stdout.split('\n');

  return testfiles.reduce((entryMap: EntryMap, filename: string) => {
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

async function startWorkers(concurrentWorkers: number, jobs: Array<string>) {
  console.log('\n', chalk.cyan('Beginning tests'), '\n');
  const browser = await launch();

  // Don't start more workers than there are jobs
  const workerCount = Math.min(concurrentWorkers, jobs.length);

  // Start work
  const workersList = _.range(workerCount).map(i => handleTest(i, jobs.pop(), jobs, [], browser));

  // As it completes, each worker returns an array of failed tests
  const testFails = await Promise.all(workersList).then(failLists => _.flatten(failLists));
  browser.close();
  return testFails;
}

async function handleTest(workerId: number, job: string | undefined, jobs: Array<string>, fails: Array<TestResult>, browser: Browser): Promise<TestFails> {
  if (!job) {
    if (DEBUG_WORKERS) console.log(chalk.cyan(`\nWorker #${workerId} terminating`));
    return fails;
  }

  if (DEBUG_WORKERS) console.log(chalk.cyan(`\nWorker #${workerId} starting ${job}`));
  fails = fails.concat(await runTest(job, browser));
  if (DEBUG_WORKERS) console.log(chalk.cyan(`\nWorker #${workerId} completed ${job}`));

  return handleTest(workerId, jobs.pop(), jobs, fails, browser)
}

async function runTest(testfile: string, browser: Browser): Promise<TestFails> {
  const htmlTestfileName = path.resolve(__dirname, `template.html`);
  const jsTestfile = path.resolve(__dirname, 'lib', `${testfile}.bundle.js`);
  const jsCommonfile = path.resolve(__dirname, 'lib', 'common.bundle.js');
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

  page.on('dialog', (dialog: any) => dialog.close());
  page.on('pageerror', console.error);

  await page.goto('file:///' + htmlTestfileName);
  await page.addScriptTag({
    path: path.resolve(__dirname, '../node_modules/mocha/mocha.js')
  })

  await page.evaluate(createMochaReporter);

  // TODO: Dynamically figure out what to add, esp. for chunk(s).
  await page.addScriptTag({
    path: jsCommonfile,
  })
  await page.addScriptTag({
    path: jsTestfile,
  })

  await page.evaluate(runMocha);

  // TODO: __TEST_RESULT__
  await page.waitForFunction(() => (window as any).__MOCHA_RESULT__);
  await page.close();

  // TODO: Validate here
  if (!testFails) throw new Error(`Error collecting test results from ${testfile}`);

  return testFails;
}

run();
