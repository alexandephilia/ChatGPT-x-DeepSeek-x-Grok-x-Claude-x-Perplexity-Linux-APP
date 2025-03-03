# AI Chat Desktop Applications
![image](https://github.com/user-attachments/assets/29bc20ee-56bd-46f5-b5a3-43603723a7a7)

This repository contains Electron-based desktop applications for various AI chat platforms. Each application is designed to provide a native desktop experience for web-based AI chat services. 

> Contributors: Alexandephilia x Sonnet 3.5 

> Forked by : Asaadzx ദ്ദി(˵ •̀ ᴗ - ˵ ) ✧

## Repository Structure

```
electron_app/
├── ChatGPT_APP/       # Electron wrapper for ChatGPT
└── Grok_APP/          # Electron wrapper for Grok
```

### Grok APP

![image](https://github.com/user-attachments/assets/f6f8b27a-085c-49b0-8671-2e6bec62ff71)

An Electron-based desktop application for Grok.

**Key Files:**
- `main.js` - Main Electron process that creates windows and handles system integration
- `renderer.js` - Renderer process script that interacts with the Grok web interface
- `preload.js` - Preload script that bridges the main and renderer processes
- `package.json` - Project configuration and dependencies
- `chatgpt.png` - Application icon
- `dist/` - Build output directory

**Features:**
- System tray integration
- Hardware acceleration for better performance
- Media access for voice input
- Single instance lock to prevent multiple instances

## Building and Running

application can be built and run independently:

### Grok APP

```bash
cd Grok_APP
npm install
npm start     # Run the application
npm run build # Build the application
```

## License

- Grok_APP: Refer to their respective package.json files

## Notes

These applications are wrappers around web-based services and may be subject to the terms of service of their respective platforms. They are designed to enhance the user experience by providing native desktop integration features. 
