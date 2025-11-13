/**
 * HomeScreen.tsx
 *
 * This is our main home screen component. It's the first screen users see when they open the app.
 *
 * KEY CONCEPTS IN THIS FILE:
 * - Functional Components: Modern React uses functions (not classes) to create components
 * - JSX: The HTML-like syntax that describes our UI
 * - TypeScript: Provides type safety to catch errors before runtime
 * - React Hooks: Functions like useState that add features to functional components
 * - Styling: React Native uses StyleSheet for styling (similar to CSS but not identical)
 */

// These are imports - bringing in code from other files/packages
// React: The core library that makes components work
import React, { useState } from 'react';
// React Native components: Building blocks for our mobile UI
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';

/**
 * HomeScreen Component
 *
 * This is a functional component - it's essentially a function that returns JSX.
 * JSX is JavaScript XML - it looks like HTML but it's actually JavaScript.
 *
 * In React Native, we don't have <div>, <p>, <button> like in web development.
 * Instead, we use React Native components like <View>, <Text>, <TouchableOpacity>.
 *
 * Why functional components?
 * - Simpler to write and understand
 * - Better performance
 * - Easier to test
 * - Can use Hooks (like useState, useEffect)
 */
export default function HomeScreen() {
  /**
   * useState Hook - Managing Component State
   *
   * State is data that can change over time. When state changes, React automatically
   * re-renders the component to show the updated information.
   *
   * Syntax breakdown: const [value, setValue] = useState<type>(initialValue)
   * - count: the current value of our state
   * - setCount: a function to update the count (NEVER modify count directly!)
   * - useState: the React Hook that creates state
   * - <number>: TypeScript type annotation (ensures count is always a number)
   * - (0): the initial value
   *
   * Why use state instead of regular variables?
   * Regular variables reset on every render and don't trigger re-renders.
   * State persists across renders and triggers UI updates when changed.
   */
  const [count, setCount] = useState<number>(0);

  /**
   * Event Handler Function
   *
   * This function runs when the user presses the button.
   * It updates the count by adding 1 to the current value.
   *
   * Note: We use setCount (not count = count + 1) because:
   * 1. Direct modification doesn't trigger re-renders
   * 2. React state should be treated as immutable (read-only)
   * 3. setCount tells React "the state changed, please update the UI"
   */
  const handlePress = () => {
    setCount(count + 1);
  };

  /**
   * The return statement contains JSX - what gets rendered on screen
   *
   * JSX Rules:
   * 1. Must return a single parent element (our container View)
   * 2. Use {} for JavaScript expressions inside JSX
   * 3. Use camelCase for props (backgroundColor not background-color)
   * 4. Components must be capitalized (<View> not <view>)
   * 5. Self-closing tags need /> (<View /> not <View>)
   */
  return (
    <View style={styles.container}>
      {/*
        StatusBar controls the status bar appearance (time, battery, signal)
        - barStyle: 'dark-content' makes icons dark (good for light backgrounds)
        - Android and iOS handle status bars differently, so we configure it explicitly
      */}
      <StatusBar barStyle="dark-content" />

      {/*
        View Component - The Container

        View is like a <div> in web development. It's a container that:
        - Groups other components together
        - Can be styled (background, borders, spacing, etc.)
        - Doesn't display text directly (use Text for that)

        The style prop applies our custom styles defined below
      */}
      <View style={styles.header}>
        {/*
          Text Component - Displaying Text

          In React Native, ALL text must be inside <Text> components.
          You can't just write text directly like in HTML.

          Why? React Native needs to handle text rendering differently on iOS/Android.
        */}
        <Text style={styles.title}>Welcome to POCHOCLO!</Text>
        <Text style={styles.subtitle}>Your React Native Learning Journey</Text>
      </View>

      {/* Content section */}
      <View style={styles.content}>
        <Text style={styles.description}>
          This is a learning project built with:
        </Text>

        {/* Technology stack list */}
        <View style={styles.techList}>
          <Text style={styles.techItem}>✓ React Native - Mobile app framework</Text>
          <Text style={styles.techItem}>✓ TypeScript - Type-safe JavaScript</Text>
          <Text style={styles.techItem}>✓ Expo - Development tools & services</Text>
          <Text style={styles.techItem}>✓ Supabase - Backend & database</Text>
        </View>

        {/* Interactive counter section */}
        <View style={styles.counterSection}>
          <Text style={styles.counterLabel}>Button Press Counter:</Text>
          {/*
            Dynamic content in JSX uses curly braces {}
            This displays the current value of the count state
          */}
          <Text style={styles.counterValue}>{count}</Text>

          {/*
            TouchableOpacity - Interactive Button

            This is a button component that:
            - Responds to touches/taps
            - Provides visual feedback (opacity changes when pressed)
            - Triggers the onPress event when tapped

            Alternative button components:
            - TouchableHighlight: Shows background color when pressed
            - TouchableWithoutFeedback: No visual feedback
            - Pressable: More advanced touch handling (newer, more flexible)

            We chose TouchableOpacity because it's simple and gives good feedback
          */}
          <TouchableOpacity
            style={styles.button}
            onPress={handlePress}
            activeOpacity={0.7} // How transparent it gets when pressed (0-1)
          >
            <Text style={styles.buttonText}>Press Me!</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Tap the button to see state management in action
          </Text>
        </View>
      </View>

      {/* Footer section */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Check the code to learn how this works!
        </Text>
      </View>
    </View>
  );
}

/**
 * StyleSheet - Styling in React Native
 *
 * StyleSheet.create() is used to define styles (similar to CSS).
 *
 * Key differences from web CSS:
 * 1. No units: Use numbers directly (e.g., fontSize: 24 not "24px")
 * 2. camelCase: Use backgroundColor not background-color
 * 3. Limited properties: Not all CSS properties exist
 * 4. Flexbox by default: Layout uses flexbox (flex-direction: 'column' by default)
 * 5. No cascading: Styles don't cascade like in CSS (more predictable!)
 *
 * Why StyleSheet.create() instead of inline objects?
 * - Performance: Styles are optimized and sent to native once
 * - Validation: Catches style errors during development
 * - Organization: Keeps styles separate from component logic
 */
const styles = StyleSheet.create({
  // Main container - takes up full screen
  container: {
    flex: 1, // flex: 1 means "take up all available space"
    backgroundColor: '#F5F5F5', // Light gray background
  },

  // Header section at the top
  header: {
    backgroundColor: '#6200EE', // Purple color (Material Design primary)
    paddingTop: 60, // Extra space for status bar (iOS safe area)
    paddingBottom: 30,
    paddingHorizontal: 20, // paddingHorizontal = paddingLeft + paddingRight
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Shadow for Android
    elevation: 5,
  },

  // Main title text
  title: {
    fontSize: 28,
    fontWeight: 'bold', // Makes text bold
    color: '#FFFFFF', // White color
    marginBottom: 8, // Space below
  },

  // Subtitle text
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0', // Light gray
  },

  // Content area - uses flex to take remaining space
  content: {
    flex: 1, // Takes all remaining space (pushes footer to bottom)
    padding: 20,
  },

  // Description text
  description: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 20,
  },

  // Technology list container
  techList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // Rounded corners
    padding: 20,
    marginBottom: 30,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    // Shadow for Android
    elevation: 2,
  },

  // Individual tech item
  techItem: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 12,
    lineHeight: 22, // Space between lines
  },

  // Counter section
  counterSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center', // Center content horizontally
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    // Shadow for Android
    elevation: 2,
  },

  // Counter label
  counterLabel: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 10,
  },

  // Counter value display
  counterValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6200EE',
    marginBottom: 20,
  },

  // Button styling
  button: {
    backgroundColor: '#6200EE', // Purple background
    paddingVertical: 15, // Vertical padding (top + bottom)
    paddingHorizontal: 40, // Horizontal padding (left + right)
    borderRadius: 25, // Rounded corners (half of height for pill shape)
    marginBottom: 15,
    // Shadow for iOS
    shadowColor: '#6200EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    // Shadow for Android
    elevation: 8,
  },

  // Button text
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600', // Semi-bold
    textAlign: 'center',
  },

  // Hint text below button
  hint: {
    fontSize: 13,
    color: '#999999',
    fontStyle: 'italic',
  },

  // Footer at bottom
  footer: {
    padding: 20,
    alignItems: 'center',
  },

  // Footer text
  footerText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});
