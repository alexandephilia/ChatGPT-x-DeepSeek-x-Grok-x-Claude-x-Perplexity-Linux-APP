const { app, BrowserWindow, Tray, Menu, systemPreferences, session, dialog, desktopCapturer, ipcMain, protocol, net, shell } = require('electron');
const path = require('path');
const crypto = require('crypto');

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
    let authState;

    // Register custom protocol
    if (process.defaultApp) {
      if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('grok-auth', process.execPath, [path.resolve(process.argv[1])])
      }
    } else {
      app.setAsDefaultProtocolClient('grok-auth');
    }

    // Handle custom protocol
    app.on('open-url', (event, url) => {
      event.preventDefault();
      handleAuthCallback(url);
    });

    // Handle auth callback
    async function handleAuthCallback(url) {
      try {
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        const code = params.get('code');
        const state = params.get('state');

        // Verify state to prevent CSRF
        if (state !== authState) {
          console.error('State mismatch in auth callback');
          return;
        }

        if (code) {
          // Exchange code for tokens here
          console.log('Auth code received:', code);
          
          // Show and focus main window
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            
            // Send auth success to renderer
            mainWindow.webContents.send('auth-success', { code });
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
      }
    }

    // Initialize Google OAuth
    function initializeGoogleAuth() {
      // Google OAuth 2.0 configuration
      const clientId = 'YOUR_CLIENT_ID';
      const redirectUri = 'grok-auth://callback';
      const scope = 'email profile';
      
      return {
        startAuth: () => {
          // Generate random state
          authState = crypto.randomBytes(16).toString('hex');
          
          // Construct auth URL
          const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
          authUrl.searchParams.append('client_id', clientId);
          authUrl.searchParams.append('redirect_uri', redirectUri);
          authUrl.searchParams.append('response_type', 'code');
          authUrl.searchParams.append('scope', scope);
          authUrl.searchParams.append('state', authState);
          authUrl.searchParams.append('access_type', 'offline');
          authUrl.searchParams.append('prompt', 'consent');
          
          // Open default browser
          shell.openExternal(authUrl.toString());
        }
      };
    }

    function createTray() {
      const iconPath = path.join(__dirname, 'grok.png');
      tray = new Tray(iconPath);
      
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Show', click: () => mainWindow.show() },
        { label: 'Hide', click: () => mainWindow.hide() },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() }
      ]);

      tray.setToolTip('Grok App');
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
              "default-src 'self' https: app: 'unsafe-inline' 'unsafe-eval' data: blob: clipboard: mediastream: mediadevices: *.cloudflare.com challenges.cloudflare.com; " +
              "media-src 'self' https: blob: mediastream: mediadevices: *; " +
              "connect-src 'self' https: wss: blob: mediastream: mediadevices: clipboard: *.cloudflare.com challenges.cloudflare.com; " +
              "script-src 'self' https: app: 'unsafe-inline' 'unsafe-eval' blob: clipboard: *.cloudflare.com challenges.cloudflare.com; " +
              "worker-src 'self' blob: https: *.cloudflare.com challenges.cloudflare.com; " +
              "frame-src 'self' https: *.cloudflare.com challenges.cloudflare.com; " +
              "style-src 'self' 'unsafe-inline' https: *.cloudflare.com challenges.cloudflare.com; " +
              "img-src 'self' data: https: blob: *.cloudflare.com challenges.cloudflare.com; " +
              "font-src 'self' data: https: *.cloudflare.com challenges.cloudflare.com; " +
              "clipboard-write 'self' https:; " +
              "clipboard-read 'self' https:;"
            ]
          }
        });
      });

      mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'grok.png'),
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: false,
          webSecurity: true,
          allowRunningInsecureContent: false,
          webgl: true,
          plugins: true,
          clipboard: true,
          spellcheck: true,
          enableWebSQL: true,
          v8CacheOptions: 'code',
          enableBlinkFeatures: 'Clipboard,MediaStream,AudioCapture,VideoCapture,ChromeOAuth2,SecurePaymentConfirmation,PlatformCredentials,IdentityInBrowserContext',
          additionalArguments: [
            '--enable-features=Clipboard,ClipboardBasic,ClipboardRead,ClipboardWrite,OAuth2,ChromeOAuth2,NetworkService,NetworkServiceInProcess,SecurePaymentConfirmation,ChromeExtensions,IdentityInBrowserContext,ThirdPartyStoragePartitioning',
            '--use-fake-ui-for-media-stream',
            '--enable-media-stream',
            '--enable-usermedia-screen-capturing',
            '--disable-web-security',
            '--allow-running-insecure-content',
            '--disable-site-isolation-trials',
            '--disable-features=IsolateOrigins,site-per-process',
            '--enable-blink-features=IdleDetection,ChromeOAuth2,IdentityInBrowserContext',
            '--auto-accept-camera-and-microphone-capture',
            '--enable-automation',
            '--disable-blink-features=AutomationControlled',
            '--enable-oauth2-api',
            '--enable-google-signin'
          ],
          preload: path.join(__dirname, 'preload.js')
        }
      });

      // Set up minimal CSP - we don't need all the complex stuff anymore
      session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [
              "default-src 'self' https: 'unsafe-inline' 'unsafe-eval' data: blob:;"
            ]
          }
        });
      });

      // Initialize auth handler
      const googleAuth = initializeGoogleAuth();

      // Handle auth request from renderer
      ipcMain.handle('start-google-auth', () => {
        googleAuth.startAuth();
      });

      // Load the app
      mainWindow.loadURL('https://grok.com/');
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