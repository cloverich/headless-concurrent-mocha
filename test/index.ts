import * as webpack from 'webpack'; //const webpack = require('webpack');
import * as path from 'path';
import * as _ from 'lodash';
import chalk from 'chalk';
import { config } from './webpack.config';
import { ChromeMochaRunner } from './runner';
import { reportFails } from './local-reporters';


export interface TestInput {
  entry: string;
  bundles: Array<string>;
}

async function main() {
  console.log(chalk.cyan('Beginning webpack build'), '\n');

  webpack(config, async (err, stats: any) => {
    if (err) {
      console.error(err);
      return;
    }

    // Here, I gather all entry points and assume those are the test files.
    // I pull the related bundles (a test file and the common file) and later feed it
    // to the test runner.
    // NOTE: stats.compilation object has most of the information i want.
    // But I can't find its documentation, so I don't know if its a stable api or not.
    const tests = _.map(stats.compilation.entrypoints, (entryPoint: any, entryName: string) => {
      return {
        entry: entryName,
        bundles: entryPoint.getFiles().map((assetFilename: string) => stats.compilation.assets[assetFilename].existsAt),
      }
    })

    console.log(stats.toString({
      chunks: false,
      colors: true,
      children: false,
      modules: false,
    }));

    // TODO: Measure memory used by webpack process before measuring memory used for test running

    const runner = new ChromeMochaRunner(tests, 4);
    const testFails = await runner.run();
    reportFails(testFails);

    // Non-zero exit if any tests failed
    process.exit(testFails.length);
  });
}

main();
