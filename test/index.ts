import * as webpack from 'webpack'; //const webpack = require('webpack');
import * as path from 'path';
import * as _ from 'lodash';
import chalk from 'chalk';
import { config } from './webpack.config';
import { ChromeMochaRunner } from './runner';


export interface TestInput {
  entry: string;
  bundles: Array<string>;
}

console.log(chalk.cyan('Beginning webpack build'), '\n');

webpack(config, async (err, stats: any) => {
  if (err) {
    console.error(err);
    return;
  }

  // Create a list of test files mapping their name to the bundles generated by webpack.
  // Assumes each entry file is a test (see webpack config)
  // NOTE: The stats.compilation object has most of the information i want.
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

  // TODO: Measure memory used during build and during test runs
  const runner = new ChromeMochaRunner(tests, 4);
  const results = await runner.run();
  const failCount = _.sum(results.map(result => result.stats.fails));

  // Non-zero exit if any tests failed
  process.exit(failCount);
});
