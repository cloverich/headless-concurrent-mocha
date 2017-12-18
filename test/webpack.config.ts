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

  entry: async (): Promise<EntryMap> => {
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
    // Generate a single file for all code shared between tests
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common',
      minChunks: 2,
    }),
  ],
}
