const path = require('path');
const webpack = require('webpack');

const SOURCE_DIR = path.resolve(__dirname, '..', 'src');
const OUT_DIR = path.resolve(__dirname, 'lib');

module.exports = {
  context: SOURCE_DIR,
  resolve: {
    extensions: ['.js', '.json', '.ts', '.tsx'],
  },

  // entry is left blank, and will be injected by the script that looks
  // for test files.
  // entry: ...

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