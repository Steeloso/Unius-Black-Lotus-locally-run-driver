const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');

let mainWindow;
let server;

function createServer() {
  const expressApp = express();
  const PORT = 8765;
  
  // Serve os arquivos do BlackLotus
  expressApp.use(express.static(path.join(__dirname, 'BlackLotus')));
  
  server = expressApp.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    createWindow();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#1a1d24',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false
  });

  // Habilita Web HID API
  mainWindow.webContents.session.on('select-hid-device', (event, details, callback) => {
    event.preventDefault();
    const selectedDevice = details.deviceList.find((device) => {
      // Você pode filtrar por vendorId/productId se souber
      return true;
    });
    if (selectedDevice) {
      callback(selectedDevice.deviceId);
    } else {
      callback();
    }
  });

  // Permissões para HID
  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'hid') {
      return true;
    }
    return false;
  });

  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'hid') {
      return true;
    }
    return false;
  });

  // Carrega o BlackLotus diretamente
  mainWindow.loadURL('http://localhost:8765');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createServer();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (server) {
    server.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (server) {
    server.close();
  }
});