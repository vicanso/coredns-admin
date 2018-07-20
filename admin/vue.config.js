const webpack = require('webpack');

const env = process.env.NODE_ENV || 'development';
const appPrefix = process.env.APP_PREFIX || '/coredns';

const output = {};

if (env !== 'development') {
  output.publicPath = './';
}

module.exports = {
  devServer: {
    proxy: {
      '/coredns': {
        target: 'http://127.0.0.1:5018',
      },
    },
  },
  configureWebpack: {
    output,
    plugins: [
      new webpack.DefinePlugin({
        APP_PREFIX: JSON.stringify(appPrefix),
      }),
    ],
  },
};
