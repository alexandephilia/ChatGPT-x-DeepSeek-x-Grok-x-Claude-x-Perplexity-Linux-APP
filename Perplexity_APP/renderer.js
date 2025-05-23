// Check if electron API is available
if (!window.electron) {
  console.error('FUCK! Electron API not found in window object!');
  throw new Error('Electron API not available');
}

// Override navigator.clipboard API
const originalClipboard = navigator.clipboard;
navigator.clipboard = {
  writeText: async (text) => {
    console.log('navigator.clipboard.writeText intercepted:', text);
    try {
      await window.electron.clipboard.directWrite(text);
      console.log('Text copied to clipboard via navigator API');
      return Promise.resolve();
    } catch (error) {
      console.error('SHIT! Navigator clipboard write failed:', error);
      return Promise.reject(error);
    }
  },
  readText: async () => {
    console.log('navigator.clipboard.readText intercepted');
    try {
      const text = await window.electron.clipboard.readText();
      console.log('Text read from clipboard via navigator API');
      return Promise.resolve(text);
    } catch (error) {
      console.error('FUCK! Navigator clipboard read failed:', error);
      return Promise.reject(error);
    }
  }
};

// Function to handle copy button clicks
async function handleCopyButtonClick(button) {
  console.log('Copy button clicked');
  try {
    const textElement = button.closest('.code-block')?.querySelector('pre') || 
                       button.closest('.message')?.querySelector('pre') ||
                       button.parentElement.querySelector('pre');
    
    if (textElement) {
      const text = textElement.textContent;
      await window.electron.clipboard.directWrite(text);
      console.log('Text copied from button click');
      
      // Show feedback
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    }
  } catch (error) {
    console.error('FUCK! Copy button handler failed:', error);
  }
}

// Function to set up observer for copy buttons
function setupCopyButtonObserver() {
  console.log('Setting up copy button observer...');
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          node.querySelectorAll('button').forEach((button) => {
            if (button.textContent.includes('Copy') && !button.dataset.clipboardHandled) {
              console.log('Found new copy button, adding click handler');
              button.dataset.clipboardHandled = 'true';
              button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCopyButtonClick(button);
              });
            }
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Handle existing copy buttons and set up observer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, setting up clipboard handlers...');

  // Handle existing copy buttons
  document.querySelectorAll('button').forEach((button) => {
    if (button.textContent.includes('Copy') && !button.dataset.clipboardHandled) {
      console.log('Found existing copy button, adding click handler');
      button.dataset.clipboardHandled = 'true';
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleCopyButtonClick(button);
      });
    }
  });

  // Set up observer for future buttons
  setupCopyButtonObserver();

  // Override copy event
  document.addEventListener('copy', async (e) => {
    console.log('Copy event triggered');
    try {
      e.preventDefault();
      const selection = window.getSelection().toString();
      console.log('Selected text:', selection);
      if (selection) {
        await window.electron.clipboard.directWrite(selection);
        console.log('Text copied to clipboard successfully');
      }
    } catch (error) {
      console.error('SHIT! Copy operation failed:', error);
    }
  });

  // Override paste event
  document.addEventListener('paste', async (e) => {
    console.log('Paste event triggered');
    try {
      e.preventDefault();
      const text = await window.electron.clipboard.readText();
      console.log('Text from clipboard:', text);
      if (text) {
        document.execCommand('insertText', false, text);
        console.log('Text pasted successfully');
      }
    } catch (error) {
      console.error('FUCK! Paste operation failed:', error);
    }
  });

  // Handle keyboard shortcuts
  document.addEventListener('keydown', async (e) => {
    if (e.ctrlKey || e.metaKey) {
      console.log('Keyboard shortcut detected:', e.key);
      try {
        if (e.key === 'c') {
          console.log('Ctrl+C pressed, copying...');
          const selection = window.getSelection().toString();
          if (selection) {
            await window.electron.clipboard.directWrite(selection);
            console.log('Text copied via keyboard shortcut');
          }
        } else if (e.key === 'v') {
          console.log('Ctrl+V pressed, pasting...');
          const text = await window.electron.clipboard.readText();
          if (text) {
            document.execCommand('insertText', false, text);
            console.log('Text pasted via keyboard shortcut');
          }
        }
      } catch (error) {
        console.error('SHIT! Keyboard shortcut operation failed:', error);
      }
    }
  });

  // Monkey patch the copy button click handler
  const originalAddEventListener = Element.prototype.addEventListener;
  Element.prototype.addEventListener = function(type, listener, options) {
    if (type === 'click' && this.classList && this.classList.contains('copy-btn')) {
      console.log('Intercepting copy button click handler');
      const wrappedListener = async (event) => {
        try {
          const text = this.parentElement.querySelector('pre')?.textContent || '';
          if (text) {
            await window.electron.clipboard.directWrite(text);
            console.log('Text copied from copy button');
          }
        } catch (error) {
          console.error('FUCK! Copy button operation failed:', error);
        }
      };
      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };

  console.log('Clipboard handlers setup complete!');
}); 