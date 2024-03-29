const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: './frontend-js/main.js',
  output: {
    filename: 'main-bundled.js',
    path: path.resolve(__dirname, 'public')
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
      }
      
      ,{
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', // convert our files into safer and more traditional code, so any one running our page with a slightly older browser could still work.
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
}