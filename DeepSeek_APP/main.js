const { app, BrowserWindow, session, Tray, Menu } = require('electron');
const Store = require('electron-store');
const path = require('path');
const store = new Store();

// Keep global references
let mainWindow;
let tray;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  function createTray() {
    const iconPath = path.join(__dirname, 'DEEP_SEEK.png');
    tray = new Tray(iconPath);
    
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show', click: () => mainWindow.show() },
      { label: 'Hide', click: () => mainWindow.hide() },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ]);

    tray.setToolTip('DeepSeek Chat');
    tray.setContextMenu(contextMenu);

    // Handle click events
    tray.on('click', () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    });
  }

  function createWindow() {
    // Create a persistent session partition
    const ses = session.fromPartition('persist:deepseek', { cache: true });

    // Configure session for proper cookie handling
    ses.setPermissionRequestHandler((webContents, permission, callback) => {
      const url = webContents.getURL();
      if (url.startsWith('https://chat.deepseek.com') || 
          url.startsWith('https://accounts.google.com')) {
        callback(true);
      } else {
        callback(false);
      }
    });

    // Create the browser window with updated settings
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: path.join(__dirname, 'DEEP_SEEK.png'),
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        sandbox: false,
        partition: 'persist:deepseek',
        webSecurity: true,
        allowRunningInsecureContent: false,
      }
    });

    // Configure session for proper headers
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      let { requestHeaders } = details;
      requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      callback({ requestHeaders });
    });

    // Handle new window creation properly
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https://chat.deepseek.com') || 
          url.startsWith('https://accounts.google.com')) {
        return { action: 'allow' };
      }
      return { action: 'deny' };
    });

    // Load DeepSeek Chat
    mainWindow.loadURL('https://chat.deepseek.com');

    // Save window state
    mainWindow.on('close', (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        mainWindow.hide();
        return false;
      }
      store.set('windowBounds', mainWindow.getBounds());
    });
  }

  // Handle second instance
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Create window when Electron is ready
  app.whenReady().then(() => {
    createWindow();
    createTray();

    // Restore window state
    const bounds = store.get('windowBounds');
    if (bounds) {
      mainWindow.setBounds(bounds);
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  // Handle quit properly
  app.on('before-quit', () => {
    app.isQuitting = true;
  });

  // Quit when all windows are closed
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // Handle certificate errors
  app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    if (url.startsWith('https://chat.deepseek.com') || 
        url.startsWith('https://accounts.google.com')) {
      event.preventDefault();
      callback(true);
    } else {
      callback(false);
    }
  });
} 