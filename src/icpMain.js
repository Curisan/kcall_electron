//接收渲染进程广播的数据执行最小化 最大化  关闭的操作


var { ipcMain, BrowserWindow } = require('electron');


//获取当前的窗口对象   BrowserWindow.getFocusedWindow();


var mainWindow = BrowserWindow.getFocusedWindow();

console.log("I am here")



ipcMain.on('window-min', () => {

    console.log('window-min')

    mainWindow.minimize()

})

ipcMain.on('window-max', () => {

    if (mainWindow.isMaximized()) {
        mainWindow.restore();
    } else {
        mainWindow.maximize()
    }
})

ipcMain.on('window-close', () => {
    mainWindow.close()

})