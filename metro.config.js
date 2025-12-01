/**
 * Metro Configuration
 *
 * Metro is the JavaScript bundler for React Native. It takes all your JS/TS files
 * and bundles them into a single file that runs on your device.
 *
 * WHY WE NEED THIS:
 * - withNativeWind: Integrates Tailwind CSS processing into the Metro bundler
 * - This allows us to use className props with Tailwind classes in React Native
 *
 * HOW IT WORKS:
 * 1. Metro reads this config when starting the dev server
 * 2. withNativeWind wraps the default config to process CSS
 * 3. The input file (global.css) contains our Tailwind directives and custom styles
 */
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// Get Expo's default Metro configuration
// __dirname is a Node.js global that gives us the current directory path
const config = getDefaultConfig(__dirname);

// Wrap the config with NativeWind's Metro plugin
// This tells Metro to process our Tailwind CSS file
module.exports = withNativeWind(config, {
  // The CSS file that contains our Tailwind directives
  // This is where we define our global styles and import Tailwind
  input: "./src/styles/global.css",
  // inlineRem: Converts rem units to pixels for consistency across environments
  // 16 means 1rem = 16px (standard browser default)
  // This helps avoid issues in EAS Build where rem calculations might differ
  inlineRem: 16,
});
