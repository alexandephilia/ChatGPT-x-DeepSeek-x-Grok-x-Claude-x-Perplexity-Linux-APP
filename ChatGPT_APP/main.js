const { app, BrowserWindow, Tray, Menu, systemPreferences, session, dialog, desktopCapturer, ipcMain, protocol, net } = require('electron');
const path = require('path');

// Enable hardware acceleration
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

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  (async () => {
    const Store = (await import('electron-store')).default;
    const store = new Store();

    // Keep global references
    let mainWindow;
    let tray;

    // Request media access early
    async function requestMediaAccess() {
      // Skip media access request - we're allowing everything
      return true;
    }

    function createTray() {
      const iconPath = path.join(__dirname, 'chatgpt.png');
      tray = new Tray(iconPath);
      
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Show', click: () => mainWindow.show() },
        { label: 'Hide', click: () => mainWindow.hide() },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() }
      ]);

      tray.setToolTip('ChatGPT App');
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
      // Check if window already exists
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
        return;
      }

      // Set up CSP with media permissions
      session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
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

      mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'chatgpt.png'),
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: false,
          enableRemoteModule: true,
          experimentalFeatures: true,
          webSecurity: true,
          allowRunningInsecureContent: false,
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
          preload: path.join(__dirname, 'preload.js')
        }
      });

      // Set custom user agent
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      mainWindow.webContents.setUserAgent(userAgent);

      // Handle ALL permissions automatically
      mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        console.log('Permission auto-approved:', permission);
        callback(true); // Allow ALL permissions
      });

      // Additional permission checks - always return true
      mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) => {
        return true; // Allow ALL permission checks
      });

      // Set media access preferences
      if (process.platform === 'darwin') {
        systemPreferences.setUserDefault('kTCCServiceMicrophone', 'boolean', true);
        systemPreferences.setUserDefault('kTCCServiceCamera', 'boolean', true);
      }

      // Handle IPC for clipboard operations
      ipcMain.handle('clipboard:copy', () => {
        console.log('Main process: Handling clipboard:copy...');
        try {
          mainWindow.webContents.copy();
          console.log('Copy operation completed');
        } catch (error) {
          console.error('Copy operation failed:', error);
        }
      });

      ipcMain.handle('clipboard:paste', () => {
        console.log('Main process: Handling clipboard:paste...');
        try {
          mainWindow.webContents.paste();
          console.log('Paste operation completed');
        } catch (error) {
          console.error('Paste operation failed:', error);
        }
      });

      // Register protocol for loading local files
      protocol.handle('app', (request) => {
        console.log('Protocol handler called for:', request.url);
        const filePath = request.url.slice('app://'.length);
        return net.fetch('file://' + path.join(__dirname, filePath));
      });

      // Inject scripts before loading the page
      mainWindow.webContents.on('dom-ready', async () => {
        console.log('DOM ready, injecting scripts...');
        try {
          const rendererContent = require('fs').readFileSync(path.join(__dirname, 'renderer.js'), 'utf8');
          await mainWindow.webContents.executeJavaScript(rendererContent);
          console.log('Renderer script injected directly');
        } catch (error) {
          console.error('FUCK! Failed to inject renderer script:', error);
        }
      });

      // Load URL after script injection is set up
      mainWindow.loadURL('https://chat.openai.com/');

      // Additional debug points
      mainWindow.webContents.on('did-start-loading', () => {
        console.log('Page started loading...');
      });

      mainWindow.webContents.on('did-stop-loading', () => {
        console.log('Page finished loading...');
      });

      // Monitor page errors and console messages
      mainWindow.webContents.on('console-message', (event, level, message) => {
        console.log('Renderer Console:', message);
      });

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
    app.whenReady().then(async () => {
      await requestMediaAccess();
      createWindow();
      createTray();

      // Restore window state
      const bounds = store.get('windowBounds');
      if (bounds) {
        mainWindow.setBounds(bounds);
      }
    });

    // Handle quit properly
    app.on('before-quit', () => {
      app.isQuitting = true;
    });

    // Quit when all windows are closed
    app.on('window-all-closed', (event) => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // Handle activate event (macOS)
    app.on('activate', () => {
      createWindow();
    });
  })();
} 