const path = require('path');

module.exports = {
  entry: {
    background: './src/js/background/background',
    content: './src/js/content/content',
    options: './src/js/options/options',
    sheetMonkeyHost: './src/js/sheetMonkeyHost/sheetMonkeyHost'

  },
  output: {
    filename: './js/[name].js'
  },
  resolve: {
    modules: [path.join(__dirname, 'src'), 'node_modules']
  },
  module: {
    rules: [{
      test: /\.js$/,
      loaders: ['babel-loader'],
      include: path.resolve(__dirname, '../src/js')
    }]
  }
};
