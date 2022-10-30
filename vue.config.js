const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  devServer: {
    host:'',
    port: 8083,
    proxy: {
      '/api': {
        // target: 'https://192.168.1.69:9050',//要跨域的域名
        // debug
        target: 'https://192.168.1.69:9060',
        secure: false, //如果是https接口，如要配置此参数
        ws: true,
        changeOrigin: true,//允许跨域
      }
    }
  },
})
