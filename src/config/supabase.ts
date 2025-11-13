/**
 * supabase.ts - Supabase Client Configuration
 *
 * This file sets up our connection to Supabase, which is our backend service.
 * Think of Supabase as the "server" part of our app - it handles:
 * - Database (storing and retrieving data)
 * - Authentication (user login/signup)
 * - Storage (file uploads like images)
 * - Real-time subscriptions (live data updates)
 *
 * WHY A SEPARATE CONFIG FILE?
 * - Separation of concerns: Configuration separate from business logic
 * - Reusability: Import this one client throughout the app
 * - Security: Keeps credentials in one place (easier to manage)
 * - Maintenance: Easy to update settings without touching other code
 */

// Import the Supabase client creator function
// This function creates a configured client that can talk to your Supabase project
import { createClient } from '@supabase/supabase-js';

// Import AsyncStorage - needed for persisting user sessions
// AsyncStorage is like localStorage in web browsers, but for React Native
// It stores data on the device that persists between app restarts
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * ENVIRONMENT VARIABLES - Keeping Secrets Safe
 *
 * Environment variables are values that:
 * 1. Can change between environments (development, production)
 * 2. Should NOT be committed to version control (for security)
 * 3. Are loaded from .env files (not hardcoded)
 *
 * In Expo, we access them using process.env.VARIABLE_NAME
 *
 * IMPORTANT SECURITY NOTE:
 * - Never commit API keys/secrets to Git
 * - Use .env files (which are in .gitignore)
 * - The .env.example file shows what variables are needed (without real values)
 *
 * For now, we're using placeholder values. You'll replace these with real values
 * from your Supabase project when you're ready to connect.
 */

// Supabase project URL - points to your specific Supabase project
// Format: https://xxxxxxxxxxxxx.supabase.co
// You get this when you create a project on supabase.com
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';

// Supabase anonymous/public key - allows public access to your database
// This key is safe to expose in client-side code (mobile app)
// It respects Row Level Security (RLS) policies you set in Supabase
// Format: A long string starting with 'eyJ...'
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here';

/**
 * IMPORTANT: Expo Environment Variable Naming
 *
 * In Expo, environment variables MUST start with EXPO_PUBLIC_ to be accessible
 * in your app code. This is a security feature - it prevents accidentally
 * exposing server-side secrets in your client code.
 *
 * Good: EXPO_PUBLIC_SUPABASE_URL
 * Bad:  SUPABASE_URL (won't be accessible)
 */

/**
 * Create and Export the Supabase Client
 *
 * This is the main Supabase client instance that we'll use throughout the app.
 * We configure it with:
 *
 * 1. URL: Where to connect
 * 2. Anon Key: How to authenticate
 * 3. Options: Additional configuration
 *
 * The 'auth' configuration tells Supabase how to handle user sessions:
 * - storage: Where to save session tokens (AsyncStorage = device storage)
 * - autoRefreshToken: Automatically refresh expired tokens (keep users logged in)
 * - persistSession: Save sessions so users don't have to login again
 * - detectSessionInUrl: Handle auth redirects (useful for OAuth)
 *
 * WHY THESE SETTINGS?
 * - Without persistSession, users would have to login every time they open the app
 * - autoRefreshToken prevents sessions from expiring (better user experience)
 * - AsyncStorage is the React Native equivalent of browser localStorage
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Use AsyncStorage to persist auth sessions on the device
    // This means users stay logged in even after closing the app
    storage: AsyncStorage,

    // Automatically refresh auth tokens before they expire
    // Tokens are like temporary passwords that expire for security
    autoRefreshToken: true,

    // Save the session to storage (if false, users logout when app closes)
    persistSession: true,

    // Detect sessions in URL redirects (useful for OAuth providers like Google)
    detectSessionInUrl: false, // We set to false for mobile (used for web)
  },
});

/**
 * HOW TO USE THIS IN OTHER FILES:
 *
 * Import the supabase client:
 * ```
 * import { supabase } from '../config/supabase';
 * ```
 *
 * Query data:
 * ```
 * const { data, error } = await supabase
 *   .from('table_name')
 *   .select('*');
 * ```
 *
 * Insert data:
 * ```
 * const { data, error } = await supabase
 *   .from('table_name')
 *   .insert({ column: 'value' });
 * ```
 *
 * Sign up a user:
 * ```
 * const { data, error } = await supabase.auth.signUp({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 * ```
 */

/**
 * NEXT STEPS FOR SUPABASE INTEGRATION:
 *
 * 1. Create a Supabase project at https://supabase.com
 * 2. Get your project URL and anon key from project settings
 * 3. Create a .env file (copy from .env.example)
 * 4. Add your real credentials to .env
 * 5. Create database tables in Supabase dashboard
 * 6. Set up Row Level Security (RLS) policies for data protection
 * 7. Start using supabase client in your components!
 *
 * Don't worry if this seems complex - we'll go step by step as you learn!
 */

/**
 * TypeScript Tip:
 *
 * The supabase client is fully typed! This means TypeScript will:
 * - Autocomplete table and column names
 * - Catch typos in queries
 * - Show you what data structure to expect
 *
 * To get full type safety, you can generate types from your database:
 * ```
 * npx supabase gen types typescript --project-id "your-project-id" > src/types/database.types.ts
 * ```
 *
 * Then import and use them:
 * ```
 * import { Database } from '../types/database.types';
 * export const supabase = createClient<Database>(URL, KEY);
 * ```
 */
