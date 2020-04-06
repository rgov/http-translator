const webpack = require('webpack')
const path = require('path')

const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')


module.exports = {
  mode: 'production',
  
  entry: './src/index.js',
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
          presets: ['@babel/env', '@babel/react']
        }
      },
      {
        test: /\.s?css$/,
        use: [ MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader' ]
      }
    ]
  },
  
  // Use Preact compatibility layer in React's place
  resolve: {
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
    }
  },
  
  plugins: [
    new CopyWebpackPlugin([
      { from: 'src/index.html' }
    ]),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    })
  ],
  
  // This is to fix the fact that argparse has some code that accesses the
  // filesystem, but we obviously don't use that in the browser
  node: {
    fs: "empty"
  }
}
