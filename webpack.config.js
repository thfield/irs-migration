const path = require('path')
// const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: {
    app: './src/explore.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'public/javascripts')
  },
  // plugins: [
  //   // new CleanWebpackPlugin(['dist']),
  //   new HtmlWebpackPlugin({
  //     filename: 'explore.html',
  //     template: 'src/explore.ejs',
  //     chunks: ['app']
  //   })
  // ],
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['babel-preset-env']
          }
        }
      }
    ]
  }
}
