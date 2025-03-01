#!/bin/bash

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Create build directory if it doesn't exist
mkdir -p build

# Copy icon to build resources
cp grok.png build/icon.png

# Fix 7zip permissions
sudo chmod +x /usr/local/lib/node_modules/electron-builder/node_modules/7zip-bin/linux/x64/7za

# Install dependencies
npm install

# Build the app
npm run build:linux

echo "Build complete! Check the dist directory for your AppImage." 