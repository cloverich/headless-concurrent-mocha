// const { EventEmitter } = require('../../Library/Caches/typescript/2.6/node_modules/@types/events');
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const execa = require('execa');
const runner = require('mocha-headless-chrome');
const SpecReporter = require('mocha/lib/reporters/spec');
const { EventEmitter } = require('events');
const { isEmpty } = require('lodash');


// TODO: I wonder if there's a way to xargs this, then _read_ the filenames off of webpack
// stats and obviate the need to use the webpack programmatic api at all?
// Probably not, because ultimately I want to watch, and most likely need to do that programmatically
// anyways...
async function getTestFilenames() {
  const { stdout } = await execa('find', ['src', '-type', 'f', '-name', '*.spec.*']);
  const testfiles = stdout.split('\n');
  return testfiles.reduce((entryMap, filename) => {
    entryMap[filename] = path.resolve(__dirname, filename);
    return entryMap;
  }, {});
}

async function run() {


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
      path: path.resolve(__dirname, 'test'),
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

  webpack(wpConfig, async (err, stats) => {
    if (err) {
      console.error(err);
      return;
    }

    console.log(stats.toString({
      chunks: false,
      colors: true
    }))


    function createOpts(filename) {
      return {
        file: filename,                           // test page path
        reporter: 'none',                             // mocha reporter name
        width: 800,                                  // viewport width
        height: 600,                                 // viewport height
        timeout: 120000,                             // timeout in ms
        // executablePath: '/usr/bin/chrome-unstable',  // chrome executable path
        visible: false,                               // show chrome window
        args: ['no-sandbox']                         // chrome arguments
      }
    }

    const runnerStub = new EventEmitter();
    new SpecReporter(runnerStub);

    const allResults = {
      tests: [],
      failures: [],
      passes: [],
    };

    for (filename of testfiles) {
      const testfile = path.resolve(__dirname, 'test', `${filename}.html`);
      console.log('running: ', testfile);
      const { result } = await runner(createOpts(testfile));

      allResults.tests = allResults.tests.concat(result.tests);
      allResults.failures = allResults.failures.concat(result.failures);
      allResults.passes = allResults.passes.concat(result.passes);


      // result.tests.forEach(test => {
      //   Nope: This won't work -- the reporter expects to receive Test (Runnable) instances.
      //   isEmpty(test.err) ? runnerStub.emit('pass', test) : runnerStub.emit('fail', test);
      // })

      // console.log(JSON.stringify(result, null, 2));
    }

    console.log('\n\nFAILURE DETAILS: \n\n');
    allResults.failures.forEach(failure => console.error(JSON.stringify(failure, null, 2)));

    console.log('\n\n');
    console.log('TOTAL TESTS: ', allResults.tests.length);
    console.log('PASSING: ', allResults.passes.length);
    console.log('FAILURES: ', allResults.failures.length);
    allResults.failures.length > 0 ? process.exit(1) : process.exit(0);
  })
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