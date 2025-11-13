/**
 * App.tsx - The Root Component
 *
 * This is the entry point of your React Native application.
 * Think of it as the "main" file - everything starts here.
 *
 * WHAT HAPPENS WHEN YOUR APP STARTS:
 * 1. React Native loads this file first
 * 2. The App() function runs
 * 3. It returns JSX (our UI components)
 * 4. React Native renders it to the mobile screen
 *
 * KEY CONCEPTS:
 * - This file is the root of your component tree
 * - All other components are children/descendants of this component
 * - Changes here affect the entire app
 */

// Import our custom HomeScreen component
// The './' means "in the current directory", then we navigate to src/screens/HomeScreen
// Note: We don't need to write '.tsx' - TypeScript knows to look for .ts/.tsx files
import HomeScreen from './src/screens/HomeScreen';

/**
 * App Component - The Root of Your Application
 *
 * This is the main component that wraps your entire app.
 * Currently it just renders the HomeScreen, but as your app grows,
 * you might add:
 * - Navigation (switching between multiple screens)
 * - Global state management (data shared across screens)
 * - Theme providers (managing colors/styling app-wide)
 * - Authentication checks (showing login vs main app)
 *
 * Why is it called "App"?
 * It's a convention - Expo/React Native looks for this as the main component.
 * The name is defined in package.json under "main": "node_modules/expo/AppEntry.js"
 * which ultimately loads this file.
 *
 * export default:
 * This makes the App component available to other files.
 * 'default' means "if you import from this file without specifying a name,
 * you get this component"
 */
export default function App() {
  /**
   * The Return Statement - What Gets Displayed
   *
   * Everything inside the return() is what appears on the screen.
   * Right now we're just rendering the HomeScreen component.
   *
   * As you build more features, you might replace this with:
   * - A navigation container (to switch between screens)
   * - A loading screen (while app initializes)
   * - Conditional rendering (show different screens based on auth status)
   *
   * For now, keeping it simple helps you learn the basics!
   */
  return <HomeScreen />;
}

/**
 * NEXT STEPS IN YOUR LEARNING JOURNEY:
 *
 * 1. Run the app (npm start) and see it in the emulator
 * 2. Try modifying the text in HomeScreen.tsx and see it update
 * 3. Change colors in the StyleSheet
 * 4. Add more useState examples
 * 5. Create a new component in src/components/
 * 6. Learn about navigation to add more screens
 * 7. Connect to Supabase for real data
 *
 * Remember: The best way to learn is by experimenting!
 * Don't be afraid to break things - you can always undo changes.
 */
