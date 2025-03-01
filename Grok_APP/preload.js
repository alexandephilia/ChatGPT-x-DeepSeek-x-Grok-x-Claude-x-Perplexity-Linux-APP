const { contextBridge, ipcRenderer, clipboard } = require('electron');

console.log('PRELOAD SCRIPT LOADED - Setting up IPC bridge...');

// Direct clipboard handler
const handleClipboardWrite = async (text) => {
  console.log('Direct clipboard write called with:', text);
  try {
    await clipboard.writeText(text);
    console.log('Direct clipboard write successful');
    return true;
  } catch (error) {
    console.error('FUCK! Direct clipboard write failed:', error);
    return false;
  }
};

// Expose clipboard functionality to renderer process
contextBridge.exposeInMainWorld(
  'electron',
  {
    clipboard: {
      readText: () => {
        console.log('Attempting to read clipboard text...');
        return clipboard.readText();
      },
      writeText: async (text) => {
        console.log('Attempting to write to clipboard:', text);
        return handleClipboardWrite(text);
      },
      copy: async () => {
        console.log('Invoking clipboard:copy...');
        return await ipcRenderer.invoke('clipboard:copy');
      },
      paste: async () => {
        console.log('Invoking clipboard:paste...');
        return await ipcRenderer.invoke('clipboard:paste');
      },
      // Add direct write method
      directWrite: handleClipboardWrite
    }
  }
);

// Override navigator.clipboard in the preload context
if (navigator.clipboard) {
  console.log('Overriding navigator.clipboard in preload context...');
  navigator.clipboard.writeText = handleClipboardWrite;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    startGoogleAuth: () => ipcRenderer.invoke('start-google-auth'),
    onAuthSuccess: (callback) => {
      ipcRenderer.on('auth-success', (event, data) => callback(data));
    }
  }
);

console.log('IPC bridge setup complete!'); 