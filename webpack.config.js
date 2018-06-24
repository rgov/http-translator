const webpack = require('webpack')
const path = require('path')

const CopyWebpackPlugin = require('copy-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')


module.exports = {
  mode: 'production',
  
  devtool: 'source-map',
  
  entry: './main.js',
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  
  // Run JavaScript through Babel
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['env', 'react']
        }
      }
    ]
  },
  
  plugins: [
    new CopyWebpackPlugin([
      { from: 'index.html' },
      { from: 'node_modules/codemirror/lib/codemirror.css' },
      { from: 'node_modules/codemirror/theme/material.css', to: 'theme.css' },
    ])
  ],
  
  // This is to fix the fact that argparse has some code that accesses the
  // filesystem, but we obviously don't use that in the browser
  node: {
    fs: "empty"
  }
}
