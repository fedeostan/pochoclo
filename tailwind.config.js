/**
 * Tailwind CSS Configuration
 *
 * This file defines our entire design system - colors, typography, spacing, etc.
 * NativeWind uses this config to generate styles for React Native.
 *
 * DESIGN PHILOSOPHY:
 * - Minimal: Clean, uncluttered interfaces with purposeful whitespace
 * - Modern: Contemporary aesthetics with subtle shadows and rounded corners
 * - Light: Warm, inviting light backgrounds (off-white, not pure white)
 * - Soft: Muted, gentle accent colors that don't strain the eyes
 *
 * HOW TO USE:
 * - Use these color names in your className: "bg-background", "text-foreground"
 * - Use semantic names: "bg-primary", "text-muted" for consistency
 * - Spacing uses our scale: "p-4" = 16px, "m-6" = 24px
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tell NativeWind which files to scan for class names
  // This enables tree-shaking (removing unused styles)
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  // Enable dark mode via class (we're light-first, but this allows future support)
  darkMode: "class",

  // Presets can extend configurations - NativeWind provides React Native compatibility
  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      /**
       * COLOR PALETTE
       *
       * Our color system follows a semantic naming convention:
       * - background/foreground: Base colors for surfaces and text
       * - primary: Main brand/action color (soft sage green - calming, modern)
       * - secondary: Supporting color for secondary actions
       * - muted: Subtle backgrounds and less important text
       * - accent: Highlight color for special elements
       * - destructive: Error states and dangerous actions
       *
       * Each color has a DEFAULT and a "foreground" variant:
       * - DEFAULT: The background/fill color
       * - foreground: Text color that contrasts well on that background
       */
      colors: {
        // Base colors - warm off-white background, dark gray text
        background: "#FAFAF9", // Warm off-white (stone-50)
        foreground: "#1C1917", // Rich dark brown-gray (stone-900)

        // Card surfaces - slightly elevated from background
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1C1917",
        },

        // Primary - Soft sage green (calming, nature-inspired, modern)
        primary: {
          DEFAULT: "#6B8E7B", // Soft sage green
          foreground: "#FFFFFF",
          // Variants for different states
          50: "#F2F7F4",
          100: "#E0EBE4",
          200: "#C4D9CC",
          300: "#9DBFAA",
          400: "#6B8E7B", // DEFAULT
          500: "#567A66",
          600: "#446152",
          700: "#384F43",
          800: "#2F4038",
          900: "#28362F",
        },

        // Secondary - Warm neutral for secondary actions
        secondary: {
          DEFAULT: "#F5F5F4", // Stone-100
          foreground: "#44403C", // Stone-700
        },

        // Muted - For subtle text and backgrounds
        muted: {
          DEFAULT: "#F5F5F4", // Stone-100
          foreground: "#78716C", // Stone-500
        },

        // Accent - Soft warm peach for highlights
        accent: {
          DEFAULT: "#FEF3E7", // Soft peach background
          foreground: "#C2785C", // Warm terracotta text
        },

        // Destructive - Soft red for errors (not harsh)
        destructive: {
          DEFAULT: "#FEE2E2", // Red-100
          foreground: "#B91C1C", // Red-700
        },

        // Border color - subtle and unobtrusive
        border: "#E7E5E4", // Stone-200

        // Input backgrounds and borders
        input: "#E7E5E4", // Stone-200

        // Ring color for focus states
        ring: "#6B8E7B", // Primary color for focus rings
      },

      /**
       * BORDER RADIUS
       *
       * We use generous, consistent border radius for a soft, modern feel.
       * Default is 12px - friendly and approachable.
       */
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
        full: "9999px",
      },

      /**
       * FONT FAMILY
       *
       * System fonts for optimal performance and native feel.
       * React Native uses the system font by default, which looks great on both platforms.
       */
      fontFamily: {
        sans: ["System"],
      },

      /**
       * SPACING SCALE
       *
       * Extended spacing for more layout flexibility.
       * Base unit is 4px (Tailwind default).
       */
      spacing: {
        18: "72px",
        88: "352px",
      },

      /**
       * BOX SHADOW
       *
       * Soft, subtle shadows for depth without harshness.
       * Use sparingly - minimal design means minimal shadows.
       */
      boxShadow: {
        soft: "0 2px 8px rgba(0, 0, 0, 0.04)",
        card: "0 4px 12px rgba(0, 0, 0, 0.05)",
      },
    },
  },

  plugins: [],
};
