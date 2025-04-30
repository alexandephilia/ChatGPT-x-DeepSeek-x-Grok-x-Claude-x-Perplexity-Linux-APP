const { app, BrowserWindow, session, Tray, Menu, systemPreferences } = require('electron');
const Store = require('electron-store');
const path = require('path');
const store = new Store();

// Enable hardware acceleration and media features
app.commandLine.appendSwitch('enable-accelerated-mjpeg-decode');
app.commandLine.appendSwitch('enable-accelerated-video');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
app.commandLine.appendSwitch('enable-zero-copy');

// Enable WebRTC and Media features
app.commandLine.appendSwitch('enable-features', 'WebRTCPipeWireCapturer,MediaStreamAPI,AutoplayPolicy');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('enable-speech-api');
app.commandLine.appendSwitch('enable-media-stream');
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
app.commandLine.appendSwitch('enable-usermedia-screen-capturing');

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

    // Configure session to allow ALL permissions
    ses.setPermissionRequestHandler((webContents, permission, callback) => {
      console.log('Permission auto-approved:', permission);
      callback(true); // Allow ALL permissions
    });

    // Additional permission checks - always return true
    ses.setPermissionCheckHandler((webContents, permission) => {
      return true; // Allow ALL permission checks
    });

    // Create the browser window with updated settings
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: path.join(__dirname, 'DEEP_SEEK.png'),
      autoHideMenuBar: true, // Hide the top menu bar
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        sandbox: false,
        partition: 'persist:deepseek',
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: true,
        webgl: true,
        plugins: true,
        clipboard: true,
        spellcheck: true,
        enableWebSQL: true,
        enableBlinkFeatures: 'Clipboard,MediaStream,AudioCapture,VideoCapture',
        additionalArguments: [
          '--enable-features=Clipboard,ClipboardBasic,ClipboardRead,ClipboardWrite',
          '--use-fake-ui-for-media-stream',
          '--enable-media-stream',
          '--enable-usermedia-screen-capturing'
        ],
      }
    });

    // Set media access preferences for macOS
    if (process.platform === 'darwin') {
      systemPreferences.setUserDefault('kTCCServiceMicrophone', 'boolean', true);
      systemPreferences.setUserDefault('kTCCServiceCamera', 'boolean', true);
    }

    // Configure session for proper headers
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      let { requestHeaders } = details;
      requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      callback({ requestHeaders });
    });

    // Set up CSP with media permissions
    ses.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' https: app: 'unsafe-inline' 'unsafe-eval' data: blob: clipboard: mediastream: mediadevices:; " +
            "media-src 'self' https: blob: mediastream: mediadevices: *; " +
            "connect-src 'self' https: wss: blob: mediastream: mediadevices: clipboard:; " +
            "script-src 'self' https: app: 'unsafe-inline' 'unsafe-eval' blob: clipboard:; " +
            "worker-src 'self' blob: https:; " +
            "frame-src 'self' https:; " +
            "style-src 'self' 'unsafe-inline' https:; " +
            "img-src 'self' data: https: blob:; " +
            "clipboard-write 'self' https:; " +
            "clipboard-read 'self' https:;"
          ]
        }
      });
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