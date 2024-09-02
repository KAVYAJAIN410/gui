const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const fs = require('fs');
const { createWriteStream } = require('fs');

let mainWindow;
let loadingWindow;
let port;
const writeStream = createWriteStream('data.csv', { flags: 'a' }); // Append mode for CSV file

function createWindow() {
  loadingWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  loadingWindow.loadFile('loading.html');

  mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    loadingWindow.close();
    mainWindow.setFullScreen(true);
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('start-serial-port', () => initializeSerialPort());
  ipcMain.handle('close-serial-port', () => closeSerialPort());

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

async function initializeSerialPort() {
  try {
    port = new SerialPort({
      path: '/dev/tty.usbserial-10', // Update with your serial port path
      baudRate: 9600,
    });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    parser.on('data', (data) => {
      console.log(`Received data: ${data}`);
      mainWindow.webContents.send('serial-data', data);

      const values = data.split(',');

      if (values.length >= 12) { // Check if all expected values are present
        const temperature = values[9];
        const airSpeed = values[6];
        const altitude = values[5];
        const voltage = values[10];
        const pressure = values[11];

        const csvLine = `${temperature},${airSpeed},${altitude},${voltage},${pressure}\n`;

        writeStream.write(csvLine, (err) => {
          if (err) {
            console.error('Error writing to CSV file:', err);
          }
        });
      } else {
        console.error('Unexpected data format:', data);
      }
    });

    port.on('error', (err) => {
      console.error('Serial port error:', err);
    });
  } catch (error) {
    console.error('Failed to initialize serial port:', error);
  }
}

async function closeSerialPort() {
  if (port && port.isOpen) {
    try {
      await port.close();
      console.log('Serial port closed');
    } catch (error) {
      console.error('Failed to close serial port:', error);
    }
  }
}

app.on('before-quit', () => {
  closeSerialPort(); // Ensure port is closed before quitting
  writeStream.end(); // Close the write stream properly
});
