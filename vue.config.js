const path = require('path');

module.exports = {
  productionSourceMap: false,
  publicPath: '/FF14Tool/',
  outputDir: 'dist',
  
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    performance: {
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    }
  },
  
  chainWebpack: config => {
    config.plugin('define').tap(args => {
      args[0]['__VUE_PROD_DEVTOOLS__'] = false;
      return args;
    });
    // Disable ESLint loader
    config.module.rules.delete('eslint');
  },
  
  devServer: {
    port: 8080,
    open: false,
    compress: true
  }
};
