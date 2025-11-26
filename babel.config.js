/**
 * Babel Configuration
 *
 * This file configures how Babel transforms our JavaScript/TypeScript code.
 * Babel is a compiler that converts modern JS syntax into code that can run
 * on various platforms.
 *
 * WHY WE NEED THIS:
 * - expo-preset: Provides sensible defaults for Expo projects
 * - nativewind/babel: Enables Tailwind CSS classes in React Native
 * - react-native-reanimated/plugin: Required for smooth animations
 *   (MUST be listed last in plugins array!)
 */
module.exports = function (api) {
  // Cache the configuration for faster builds
  // When set to true, Babel will cache the config based on environment
  api.cache(true);

  return {
    // Presets include transformations for Expo/React Native and NativeWind
    // NOTE: nativewind/babel must be in presets (not plugins) for Expo SDK 52+
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],

    // Plugins extend Babel's capabilities
    plugins: [
      // Reanimated plugin MUST be last
      // It rewrites code for smooth 60fps animations
      "react-native-reanimated/plugin",
    ],
  };
};
