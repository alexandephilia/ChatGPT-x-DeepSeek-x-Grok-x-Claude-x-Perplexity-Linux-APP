const { contextBridge, ipcRenderer, clipboard } = require('electron');

console.log('PRELOAD SCRIPT LOADED - Setting up IPC bridge...');

// Handle clipboard write operations
async function handleClipboardWrite(text) {
  console.log('Handling clipboard write:', text);
  try {
    await clipboard.writeText(text);
    console.log('Text written to clipboard successfully');
    return true;
  } catch (error) {
    console.error('FUCK! Clipboard write failed:', error);
    return false;
  }
}

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