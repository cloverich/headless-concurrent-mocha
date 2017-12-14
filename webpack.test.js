const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const execa = require('execa');
const SpecReporter = require('mocha/lib/reporters/spec');
const { EventEmitter } = require('events');
const { isEmpty } = require('lodash');

const runner = require('mocha-headless-chrome');
const puppeteer = require('puppeteer');
const reporter = require('./test/reporter');
const chalk = require('chalk');

// TODO: Paramaterize
const ENABLE_CONSOLE = false;


async function getTestFilenames() {
  const { stdout } = await execa('find', ['src', '-type', 'f', '-name', '*.spec.*']);
  const testfiles = stdout.split('\n');
  return testfiles.reduce((entryMap, filename) => {
    // todo: src/__test__/my-test.tsx --> __test__/my-test.tsx
    entryMap[filename.replace(/\//g, '_')] = path.resolve(__dirname, filename);
    return entryMap;
  }, {});
}

async function run() {
  const entry = await getTestFilenames();
  const testfiles = Object.keys(entry);

  const wpConfig = {
    context: path.resolve(__dirname, 'src'),
    resolve: {
      extensions: ['.js', '.json', '.ts', '.tsx'],
    },

    // todo: document details of this.
    // entry: {
    //   one: './__tests__/index.spec.tsx',
    //   two: './__tests__/test2.spec.tsx',
    // },
    entry,
    output: {
      path: path.resolve(__dirname, 'test/lib'),
      filename: '[name].bundle.js',
    },
    externals: ['mocha'],
    module: {
      rules: [
        {
          test: /\.tsx?/,
          include: [
            path.resolve(__dirname, 'src'),
          ],
          use: 'ts-loader'
        },
      ]
    },
    plugins: [
      new webpack.optimize.CommonsChunkPlugin({
        name: 'common',
        minChunks: 2,
      }),

      // TOOD: It would be cleaner to generate these on demand if the pupeteer api allows
      ...testfiles.map(filename => {
        return new HtmlWebpackPlugin({
          inject: false,
          title: filename,
          chunks: ['common', filename],
          filename: `${filename}.html`,
          template: '../test/template.html',
        })
      }),
    ],
  }

  console.log(chalk.cyan('Beginning webpack build'), '\n');

  webpack(wpConfig, async (err, stats) => {
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
    }))


    const browser = await puppeteer.launch();
    let testFails = [];


    console.log('\n', chalk.cyan('Beginning tests'), '\n');

    for (testfile of testfiles) {
      const fullname = path.resolve(__dirname, 'test/lib', `${testfile}.html`);
      const page = await browser.newPage();

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
          const fails = onReport(testfile, report);
          testFails = testFails.concat(fails);
        }
      });

      page.on('dialog', dialog => dialog.close());
      page.on('pageerror', console.error);

      await page.goto('file:///' + fullname);
      const result = await page.evaluate(reporter);
      await page.waitForFunction(() => window.__MOCHA_RESULT__);
      await page.close();
    }

    if (testFails.length) {
      console.log('\n', chalk.red(testFails.length, 'tests failed.\n'));
      testFails.forEach((test, idx) => {
        console.log(`  ${idx + 1}) ${test.title}:`, chalk.red(test.err.message));
        console.log('    Actual:', chalk.cyan(test.err.actual));
        console.log('\n', chalk.dim(test.err.stack), '\n');
      });
    }

    await browser.close();

    // Non-zero exit if any tests failed
    process.exit(testFails.length);
  });
}

const isWin32 = process.platform === 'win32';

// Adapted from mocha/lib/base.js
const symbols = {
  ok: isWin32 ? '\u221A' : '✓',
  err: isWin32 ? '\u00D7' : '✖',
  dot: '․',
  comma: ',',
  bang: '!'
};


function onReport(testFilename, report) {
  let currentSuite = [];
  const fails = [];

  console.log('\n', chalk.cyan(`Reporting test: ${testFilename}`), '\n');

  report.events.forEach(event => {
    switch (event.type) {
      case 'suite_start':
        currentSuite = event.value;

        // Mocha passes up [] for first suite; don't print it.
        if (!currentSuite.length) return;

        console.log(
          // Indent one level for each suite
          currentSuite.map(i => '  ').join(''),
          event.value[event.value.length - 1],
        );
        break;
      case 'suite_end':
        currentSuite.pop();
        break;
      case 'test':
        console.log(
          // Indent one level deeper than the Suite
          [1].concat(currentSuite).map(i => '  ').join(''),
          event.value.status === 'pass' ? chalk.green(symbols.ok) : chalk.red(symbols.err),
          chalk.dim(event.value.title),
        );

        if (event.value.status === 'fail') fails.push(event.value);

        break;
      default:
        throw new Error("Unexpected event type from report: ", event.type);
    }
  })

  return fails;
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