/**
 * firebase.ts - Firebase Client Configuration
 *
 * This file sets up our connection to Firebase, which is our backend service.
 * Think of Firebase as the "server" part of our app - it handles:
 * - Authentication (user login/signup via Firebase Auth)
 * - Database (Firestore for storing and retrieving data)
 * - Storage (file uploads like images)
 * - And many more services (Cloud Functions, Analytics, etc.)
 *
 * WHY A SEPARATE CONFIG FILE?
 * - Separation of concerns: Configuration separate from business logic
 * - Reusability: Import this one configuration throughout the app
 * - Security: Keeps credentials in one place (easier to manage)
 * - Maintenance: Easy to update settings without touching other code
 *
 * FIREBASE VS SUPABASE - KEY DIFFERENCES:
 * - Firebase is Google's platform, Supabase is PostgreSQL-based
 * - Firebase Auth handles tokens internally (no Session object needed!)
 * - Firebase uses listeners (onAuthStateChanged) instead of getSession()
 * - Firebase config is a simple object, not environment-based URL+key
 *
 * EXPO + FIREBASE SETUP:
 * For React Native with Expo, we use the Firebase JS SDK (not React Native Firebase).
 * This is simpler to set up and works well with Expo's managed workflow.
 * We configure persistence using AsyncStorage so users stay logged in.
 */

// Import Firebase core initialization functions
// getApps() lets us check if Firebase is already initialized (prevents double init)
// initializeApp() creates the Firebase app instance
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';

// Import Firebase Auth functions
// initializeAuth() sets up authentication with custom options
// getAuth() gets the existing auth instance
// Auth is the type for the auth instance
// getReactNativePersistence() provides session persistence for React Native apps
import {
  initializeAuth,
  getAuth,
  Auth,
  getReactNativePersistence,
} from 'firebase/auth';

// Import Firebase Firestore (NoSQL database)
// getFirestore() returns the Firestore database instance
// Firestore stores data in collections and documents (like folders and files)
import { getFirestore, Firestore } from 'firebase/firestore';

// Import Firebase Storage (for file uploads like images)
// getStorage() returns the Storage instance for uploading/downloading files
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Import AsyncStorage for persisting auth sessions
// This is the React Native equivalent of browser localStorage
// It stores data on the device that persists between app restarts
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * FIREBASE CONFIGURATION
 *
 * This object contains all the credentials needed to connect to your Firebase project.
 * Unlike Supabase (which uses URL + anon key), Firebase uses a config object with multiple values.
 *
 * WHERE DO THESE VALUES COME FROM?
 * 1. Go to Firebase Console (https://console.firebase.google.com)
 * 2. Select your project
 * 3. Click the gear icon (Settings) > Project settings
 * 4. Scroll down to "Your apps" section
 * 5. If no web app exists, click "Add app" > Web
 * 6. Copy the firebaseConfig object
 *
 * SECURITY NOTE:
 * These values are safe to include in client-side code (mobile apps).
 * Firebase Security Rules protect your data, not these config values.
 * The API key is not a secret - it just identifies your project.
 *
 * For development, we're using environment variables (best practice).
 * The fallback values are your actual Firebase config for convenience.
 */
/**
 * Validate required environment variables
 *
 * This ensures that the app won't run without proper configuration.
 * You must create a .env file with your Firebase credentials.
 * Copy .env.example to .env and fill in your values from Firebase Console.
 */
const requiredEnvVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
] as const;

// Check for missing environment variables in development
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(
    '⚠️ Missing Firebase environment variables:\n' +
      missingVars.map((v) => `  - ${v}`).join('\n') +
      '\n\nPlease create a .env file with your Firebase credentials.\n' +
      'Copy .env.example to .env and fill in your values from Firebase Console.'
  );
}

const firebaseConfig = {
  /**
   * API Key - Identifies your project to Firebase services
   * This is NOT a secret - it's safe to include in client code
   * Security comes from Firebase Security Rules, not hiding this key
   */
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,

  /**
   * Auth Domain - The domain used for Firebase Auth operations
   * Used for sign-in popups and redirects on web
   * Format: your-project-id.firebaseapp.com
   */
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,

  /**
   * Project ID - Unique identifier for your Firebase project
   * Used by all Firebase services to know which project to use
   */
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,

  /**
   * Storage Bucket - Where files are stored (Firebase Storage)
   * We'll use this later for uploading images, documents, etc.
   * Format: your-project-id.appspot.com (or .firebasestorage.app for newer projects)
   */
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,

  /**
   * Messaging Sender ID - For Firebase Cloud Messaging (push notifications)
   * We'll use this later if we add push notifications
   */
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,

  /**
   * App ID - Unique identifier for this specific app in your project
   * A Firebase project can have multiple apps (iOS, Android, Web)
   */
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,

  /**
   * Measurement ID - For Google Analytics (optional)
   * Used to track app usage and user behavior
   */
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * Initialize Firebase App
 *
 * We need to check if Firebase is already initialized before creating a new instance.
 * This prevents errors from calling initializeApp() multiple times (which would throw).
 *
 * WHY MIGHT IT INITIALIZE TWICE?
 * - React's Strict Mode (development) runs effects twice
 * - Hot Module Replacement (HMR) during development
 * - Multiple imports of this file
 *
 * PATTERN EXPLAINED:
 * getApps() returns an array of initialized Firebase apps
 * - If empty (length === 0), initialize a new app
 * - If not empty, get the existing app with getApp()
 *
 * This is a common pattern in Firebase applications!
 */
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Initialize Firebase Auth with Persistence
 *
 * Firebase Auth handles user authentication. We configure it with:
 * - Persistence: Where to store auth state (AsyncStorage for React Native)
 *
 * WHAT IS PERSISTENCE?
 * Persistence determines how auth state survives app restarts:
 * - Without persistence: User must login every time they open the app
 * - With AsyncStorage persistence: User stays logged in across app restarts
 *
 * FIREBASE AUTH PERSISTENCE OPTIONS:
 * - getReactNativePersistence(AsyncStorage): For React Native apps
 * - browserLocalPersistence: For web apps (uses localStorage)
 * - browserSessionPersistence: For web apps (session only)
 * - inMemoryPersistence: No persistence (testing)
 *
 * IMPORTANT: initializeAuth vs getAuth
 * - initializeAuth: Use ONCE when setting up auth with custom options
 * - getAuth: Use to get the existing auth instance elsewhere
 *
 * We use a try-catch because initializeAuth can only be called once.
 * If it's already initialized, getAuth() returns the existing instance.
 *
 * NOTE: getReactNativePersistence is now properly exported from 'firebase/auth'
 * in recent Firebase versions (v10.1.0+), so no workarounds are needed.
 */
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // Auth was already initialized, get the existing instance
  auth = getAuth(app);
}

/**
 * Initialize Firebase Firestore
 *
 * Firestore is a NoSQL document database. Data is organized as:
 * - Collections: Like folders that hold documents (e.g., "users", "posts")
 * - Documents: Individual records with fields (e.g., a user profile)
 * - Subcollections: Collections inside documents for nested data
 *
 * FIRESTORE VS TRADITIONAL SQL:
 * - SQL: Tables with rows and columns, strict schema
 * - Firestore: Collections with documents, flexible schema
 *
 * Example structure for our app:
 * users (collection)
 *   └── {userId} (document)
 *         ├── email: "user@example.com"
 *         ├── displayName: "John Doe"
 *         ├── photoURL: "https://..."
 *         ├── createdAt: Timestamp
 *         └── updatedAt: Timestamp
 *
 * WHY USE FIRESTORE FOR USER DATA?
 * - Firebase Auth stores basic info (email, displayName, photoURL)
 * - Firestore lets us store additional user data (preferences, settings, etc.)
 * - Easier to query and filter users
 * - Better for future features (friends, followers, etc.)
 */
const db: Firestore = getFirestore(app);

/**
 * Initialize Firebase Storage
 *
 * Firebase Storage is for uploading and downloading files (images, videos, etc.).
 * Files are organized in a folder-like structure with paths.
 *
 * STORAGE STRUCTURE FOR PROFILE IMAGES:
 * profile-images/
 *   └── {userId}/
 *         └── avatar.jpg
 *
 * WHY THIS STRUCTURE?
 * - Each user has their own folder (isolated by userId)
 * - Easy to set security rules per user
 * - Simple to find and manage a user's files
 *
 * STORAGE SECURITY:
 * Unlike the API keys in firebaseConfig, Storage needs security rules.
 * We'll configure rules in Firebase Console to:
 * - Allow users to upload only to their own folder
 * - Allow anyone to read profile images (public avatars)
 * - Limit file sizes and types
 */
const storage: FirebaseStorage = getStorage(app);

/**
 * Export Firebase Instances
 *
 * We export both app and auth so other parts of the app can use them:
 * - app: The Firebase app instance (needed for other services like Firestore)
 * - auth: The Firebase Auth instance (for authentication operations)
 *
 * USAGE IN OTHER FILES:
 *
 * For authentication:
 * ```
 * import { auth } from '../config/firebase';
 * import { signInWithEmailAndPassword } from 'firebase/auth';
 *
 * await signInWithEmailAndPassword(auth, email, password);
 * ```
 *
 * For Firestore (database) - we'll add this later:
 * ```
 * import { app } from '../config/firebase';
 * import { getFirestore } from 'firebase/firestore';
 *
 * const db = getFirestore(app);
 * ```
 *
 * For Storage (file uploads):
 * ```
 * import { storage } from '../config/firebase';
 * import { ref, uploadBytes } from 'firebase/storage';
 *
 * const storageRef = ref(storage, 'profile-images/userId/avatar.jpg');
 * await uploadBytes(storageRef, file);
 * ```
 *
 * For Firestore (database):
 * ```
 * import { db } from '../config/firebase';
 * import { doc, setDoc } from 'firebase/firestore';
 *
 * await setDoc(doc(db, 'users', userId), { photoURL: 'https://...' });
 * ```
 */
export { app, auth, db, storage };

/**
 * COMPARISON: SUPABASE VS FIREBASE SETUP
 *
 * SUPABASE:
 * ```
 * const supabase = createClient(URL, ANON_KEY, {
 *   auth: {
 *     storage: AsyncStorage,
 *     autoRefreshToken: true,
 *     persistSession: true,
 *   }
 * });
 * export { supabase };
 * ```
 *
 * FIREBASE:
 * ```
 * const app = initializeApp(config);
 * const auth = initializeAuth(app, {
 *   persistence: getReactNativePersistence(AsyncStorage)
 * });
 * export { app, auth };
 * ```
 *
 * KEY DIFFERENCES:
 * 1. Supabase uses URL + key, Firebase uses config object
 * 2. Firebase separates app and auth instances
 * 3. Firebase handles token refresh automatically (no option needed)
 * 4. Firebase persistence is configured differently
 *
 * NEXT STEPS:
 * This config file enables:
 * - User sign up and sign in (with email/password)
 * - User sign out
 * - Password reset
 * - Auth state persistence
 *
 * To add more Firebase services later:
 * - Firestore: import { getFirestore } from 'firebase/firestore'
 * - Storage: import { getStorage } from 'firebase/storage'
 * - Functions: import { getFunctions } from 'firebase/functions'
 */
