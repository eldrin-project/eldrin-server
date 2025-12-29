#!/usr/bin/env node

/**
 * Postinstall Script for @eldrin-project/eldrin-server
 *
 * Downloads the correct platform binary from GitHub releases.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PACKAGE_VERSION = require('../package.json').version;
const GITHUB_REPO = 'eldrin-project/eldrin-server';

/**
 * Get the binary name for the current platform
 */
function getBinaryName() {
  const platform = process.platform;
  const arch = process.arch;

  const platformMap = {
    'darwin-arm64': 'eldrin-core-darwin-arm64',
    'darwin-x64': 'eldrin-core-darwin-x64',
    'linux-x64': 'eldrin-core-linux-x64',
    'linux-arm64': 'eldrin-core-linux-arm64',
    'win32-x64': 'eldrin-core-win-x64.exe',
  };

  const key = `${platform}-${arch}`;
  const binary = platformMap[key];

  if (!binary) {
    console.error(`Unsupported platform: ${platform}-${arch}`);
    console.error('Supported platforms: darwin-arm64, darwin-x64, linux-x64, linux-arm64, win32-x64');
    process.exit(1);
  }

  return binary;
}

/**
 * Download a file from a URL
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (url, redirectCount = 0) => {
      if (redirectCount > 5) {
        reject(new Error('Too many redirects'));
        return;
      }

      const protocol = url.startsWith('https') ? https : require('http');

      protocol.get(url, {
        headers: {
          'User-Agent': 'eldrin-server-postinstall',
        },
      }, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          follow(response.headers.location, redirectCount + 1);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
          return;
        }

        const file = fs.createWriteStream(dest);
        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(dest, () => {}); // Delete partial file
          reject(err);
        });
      }).on('error', reject);
    };

    follow(url);
  });
}

/**
 * Make binary executable on Unix systems
 */
function makeExecutable(filePath) {
  if (process.platform !== 'win32') {
    fs.chmodSync(filePath, 0o755);
  }
}

async function main() {
  const binaryName = getBinaryName();
  const binDir = path.join(__dirname, '..', 'bin');
  const binaryPath = path.join(binDir, 'eldrin-core-binary');

  // On Windows, keep the .exe extension
  const finalBinaryPath = process.platform === 'win32'
    ? binaryPath + '.exe'
    : binaryPath;

  // Check if binary already exists
  if (fs.existsSync(finalBinaryPath)) {
    console.log('Eldrin Server binary already installed.');
    return;
  }

  // Construct download URL
  // Format: https://github.com/eldrin-project/eldrin-core/releases/download/v0.0.1/eldrin-core-darwin-arm64
  const downloadUrl = `https://github.com/${GITHUB_REPO}/releases/download/v${PACKAGE_VERSION}/${binaryName}`;

  console.log(`Downloading Eldrin Server for ${process.platform}-${process.arch}...`);
  console.log(`URL: ${downloadUrl}`);

  try {
    await downloadFile(downloadUrl, finalBinaryPath);
    makeExecutable(finalBinaryPath);
    console.log('Eldrin Server installed successfully!');
  } catch (error) {
    console.error('Failed to download Eldrin Server binary:', error.message);
    console.error('');
    console.error('You can manually download the binary from:');
    console.error(`  https://github.com/${GITHUB_REPO}/releases/tag/v${PACKAGE_VERSION}`);
    console.error('');
    console.error('And place it at:');
    console.error(`  ${finalBinaryPath}`);
    process.exit(1);
  }
}

main();
