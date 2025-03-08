// preload.js
window.addEventListener('DOMContentLoaded', () => {
    // Request microphone permissions
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        console.log('Microphone access granted');
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
      });
  });
  