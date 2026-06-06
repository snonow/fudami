// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure wasm is NOT in sourceExts (prevent Babel transformation)
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'wasm');
// Treat wasm as an asset instead
config.resolver.assetExts.push('wasm');

module.exports = config;
