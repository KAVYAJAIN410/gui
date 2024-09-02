const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  startSerialPort: () => ipcRenderer.invoke('start-serial-port'),
  closeSerialPort: () => ipcRenderer.invoke('close-serial-port'),
  onSerialData: (callback) => ipcRenderer.on('serial-data', (event, data) => callback(data)),
});
