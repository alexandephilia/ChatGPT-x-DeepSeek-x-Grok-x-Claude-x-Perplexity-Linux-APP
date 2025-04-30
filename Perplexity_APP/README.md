# Perplexity Desktop App

An Electron-based desktop application for Perplexity AI with full system permissions and functionality.

## Features

- Full clipboard support (copy/paste)
- Drag and drop functionality
- Voice/media permissions enabled
- System tray integration
- Window state persistence
- Keyboard shortcuts support
- Modern Chrome-based rendering

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

4. Build the application:
```bash
npm run build
```

The built application will be available in the `dist` directory.

## Development

- `main.js`: Main Electron process
- `preload.js`: Preload script for IPC communication
- `renderer.js`: Renderer process script for DOM manipulation

## Permissions

The application is configured with full permissions for:
- Clipboard operations
- Media access (microphone/camera)
- File system access
- Window management
- Network requests

## Building

To build for different platforms:

```bash
# For Linux
npm run build

# For Windows
npm run build -- --win

# For macOS
npm run build -- --mac
```

## License

MIT 