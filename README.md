# AI Chat Desktop Applications

This repository contains Electron-based desktop applications for various AI chat platforms. Each application is designed to provide a native desktop experience for web-based AI chat services.

## Repository Structure

```
electron_app/
├── ChatGPT_APP/       # Electron wrapper for ChatGPT
├── Claude_APP/        # Electron wrapper for Claude AI
└── DeepSeek_APP/      # Electron wrapper for DeepSeek Chat
```

## Applications

### ChatGPT_APP

An Electron-based desktop application for ChatGPT.

**Key Files:**
- `main.js` - Main Electron process that creates windows and handles system integration
- `renderer.js` - Renderer process script that interacts with the ChatGPT web interface
- `preload.js` - Preload script that bridges the main and renderer processes
- `package.json` - Project configuration and dependencies
- `chatgpt.png` - Application icon
- `dist/` - Build output directory

**Features:**
- System tray integration
- Hardware acceleration for better performance
- Media access for voice input
- Single instance lock to prevent multiple instances

> NOTE: **Voice mode and clipboard functionality fully working!**

### Claude_APP

An unofficial Electron wrapper for Claude AI desktop application.

**Key Files:**
- `README.md` - Detailed documentation about the Claude desktop application
- `build-deb.sh` - Script to build a Debian package for the application
- `LICENSE-APACHE` and `LICENSE-MIT` - Dual license files
- `.gitignore` - Git ignore configuration

**Features:**
- MCP (Model Control Protocol) support
- System tray integration
- Cross-platform compatibility with Linux focus

> NOTE: - **Quick shortcut chat with Ctrl+Alt+Space** for instant access anywhere


### DeepSeek_APP

An Electron wrapper for DeepSeek Chat.

**Key Files:**
- `main.js` - Main Electron process
- `package.json` - Project configuration and dependencies
- `DEEP_SEEK.png` - Application icon
- `dist/` - Build output directory containing the AppImage and other build artifacts
- `node_modules/` - Node.js dependencies

**Features:**
- System tray integration
- Persistent session for login state
- Permission handling for web content
- Cross-platform build configuration

## Building and Running

Each application can be built and run independently:

### ChatGPT_APP

```bash
cd ChatGPT_APP
npm install
npm start     # Run the application
npm run build # Build the application
```

### Claude_APP

```bash
cd Claude_APP
sudo ./build-deb.sh # Build a Debian package
sudo dpkg -i ./build/electron-app/claude-desktop_*.deb # Install the package
```

### DeepSeek_APP

```bash
cd DeepSeek_APP
npm install
npm start     # Run the application
npm run build # Build the application
```

## License

- ChatGPT_APP and DeepSeek_APP: Refer to their respective package.json files
- Claude_APP: Dual-licensed under MIT and Apache License 2.0

## Notes

These applications are wrappers around web-based services and may be subject to the terms of service of their respective platforms. They are designed to enhance the user experience by providing native desktop integration features. 