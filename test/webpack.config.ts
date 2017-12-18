const path = require('path');
import * as webpack from 'webpack';
import * as execa from 'execa';

const SOURCE_DIR = path.resolve(__dirname, '..', 'src');
const OUT_DIR = path.resolve(__dirname, 'lib');


interface EntryMap {
  [key: string]: string;
}

export const config: webpack.Configuration = {
  context: SOURCE_DIR,
  resolve: {
    extensions: ['.js', '.json', '.ts', '.tsx'],
  },

  // Find all test files and use each file as an individual entry, which will cause
  // webpack to generate a separate output bundle for each one. This is what lets us
  // run tests separately.
  // NOTE: Promise<any> because the webpack type thinks Promise<Map<string, string>> is
  // invalid, even though it isn't.
  entry: async (): Promise<any> => {
    const { stdout } = await execa('find', ['src', '-type', 'f', '-name', '*.spec.*']);
    const testfiles = stdout.split('\n');

    return testfiles.reduce((entryMap: EntryMap, filename: string) => {
      const source = path.resolve(__dirname, '..', filename);

      entryMap[filename] = source;
      return entryMap;
    }, {});
  },

  output: {
    path: OUT_DIR,
    filename: '[name].bundle.js',
  },
  externals: ['mocha'],
  module: {
    rules: [
      {
        test: /\.tsx?/,
        include: [
          SOURCE_DIR,
        ],
        use: 'ts-loader'
      },
    ]
  },
  plugins: [
    // Generate a single shared file for all common code (e.g. React).
    // Since we're generating a separate bundle for each test, this keeps our
    // test files small and probably speeds up the build substantially.
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common',
      minChunks: 2,
    }),
  ],
}
