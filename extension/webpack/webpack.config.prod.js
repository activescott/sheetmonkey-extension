const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const VersionFilePlugin = require('webpack-version-file-plugin');
const CrxPlugin = require('crx-webpack-plugin');

const config = require('./config.js');
const pkg = require('../package.json');

const appName = `${pkg.name}-${pkg.version}`;


module.exports = _.merge({}, config, {
  output: {
    path: path.resolve(__dirname, '../build/prod'),
  },

  // devtool: 'eval',
  plugins: [
    new CopyWebpackPlugin([
      { from: './src' }
    ], {
      ignore: ['js/**/*', 'manifest.json'],
      copyUnmodified: true
    }),
    new VersionFilePlugin({
      packageFile: path.resolve(__dirname, '../package.json'),
      template: path.resolve(__dirname, '../src/manifest.json'),
      outputFile: path.resolve(__dirname, '../build/prod/manifest.json'),
      extras: { build_env: '' }
    }),
    new webpack.DefinePlugin({ 'process.env.NODE_ENV': '"production"' })
  ]
});
