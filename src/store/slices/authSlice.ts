/**
 * Auth Slice - Redux State Management for Authentication (Firebase Version)
 *
 * This file defines all authentication-related state, actions, and async operations.
 * It uses Redux Toolkit's createSlice for state management with Firebase Auth.
 *
 * MIGRATION FROM SUPABASE TO FIREBASE - KEY CHANGES:
 * 1. No more Session object - Firebase handles tokens internally
 * 2. Different User type - Firebase User vs Supabase User
 * 3. Different auth methods - signInWithEmailAndPassword vs signInWithPassword
 * 4. initializeAuth is simpler - Firebase uses listener pattern from the start
 *
 * WHAT IS A SLICE?
 * In Redux Toolkit, a "slice" is a collection of:
 * - State: The data we're managing (user, loading, etc.)
 * - Reducers: Functions that update state in response to actions
 * - Actions: Objects that describe what happened (user signed in, etc.)
 *
 * createSlice automatically generates action creators and action types
 * from the reducers you define - no more manual action constants!
 *
 * WHAT ARE ASYNC THUNKS?
 * Thunks are functions that can dispatch actions and access state.
 * createAsyncThunk handles async operations (like API calls) and
 * automatically generates pending/fulfilled/rejected actions.
 *
 * Example flow for signIn:
 * 1. dispatch(signIn({ email, password }))
 * 2. Redux dispatches signIn.pending (loading = true)
 * 3. Thunk calls Firebase Auth
 * 4. On success: Redux dispatches signIn.fulfilled (user = data)
 * 5. On failure: Redux dispatches signIn.rejected (error = message)
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Import Firebase Auth types and methods
// User: The Firebase user object (contains uid, email, displayName, etc.)
// signInWithEmailAndPassword: Authenticates with email/password
// createUserWithEmailAndPassword: Creates a new user account
// signOut: Logs out the current user
// sendPasswordResetEmail: Sends password reset email
// updateProfile: Updates user's displayName and photoURL
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';

// Import our configured Firebase auth instance
import { auth } from '../../config/firebase';

/**
 * =============================================================================
 * SERIALIZABLE USER TYPE
 * =============================================================================
 *
 * WHY WE NEED THIS:
 * The Firebase User object is NOT serializable because it contains:
 * - Methods (getIdToken, reload, etc.)
 * - Circular references
 * - Date objects
 *
 * Redux Toolkit's middleware checks if state is serializable (can be converted
 * to JSON and back). When it tries to traverse the Firebase User object,
 * it hits circular references and crashes with "Maximum call stack size exceeded".
 *
 * SOLUTION:
 * Extract only the plain data we need into a simple object.
 * This object is fully serializable (no methods, no circular refs).
 *
 * WHAT WE KEEP:
 * - uid: Unique identifier for the user
 * - email: User's email address
 * - displayName: User's display name
 * - photoURL: User's profile photo URL
 * - emailVerified: Whether the email is verified
 *
 * WHAT WE DON'T STORE:
 * - Methods like getIdToken() - call them directly on auth.currentUser
 * - metadata - can be accessed via auth.currentUser if needed
 * - providerData - for OAuth providers, access via auth.currentUser
 */
export interface SerializableUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

/**
 * Convert Firebase User to Serializable User
 *
 * Takes a Firebase User object and extracts only the serializable properties.
 *
 * USAGE:
 * const firebaseUser = userCredential.user;
 * const serializableUser = serializeUser(firebaseUser);
 *
 * @param user - Firebase User object
 * @returns SerializableUser - Plain object safe for Redux
 */
function serializeUser(user: User): SerializableUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  };
}

/**
 * AuthState Interface
 *
 * Defines the shape of our auth state.
 * This is what lives in state.auth in the Redux store.
 *
 * FIREBASE VS SUPABASE STATE - KEY DIFFERENCE:
 * - Supabase: We stored both user AND session (tokens)
 * - Firebase: We only store user (Firebase manages tokens internally!)
 *
 * This is simpler! Firebase handles:
 * - Token storage (automatically saved to AsyncStorage)
 * - Token refresh (automatic, no config needed)
 * - Token expiration (seamless refresh)
 *
 * WHY THESE FIELDS?
 * - user: The authenticated user (null if not logged in)
 * - loading: Shows spinner during operations
 * - initialized: Prevents flash of wrong screen on app load
 * - error: Stores error messages to display to user
 */
interface AuthState {
  /**
   * Current authenticated user (SerializableUser type)
   *
   * - undefined: Haven't checked yet (initial state)
   * - null: Checked, user is not logged in
   * - SerializableUser: User is logged in
   *
   * We use undefined vs null to distinguish:
   * - undefined: "We don't know yet" (show loading)
   * - null: "We know, and no user" (show auth screens)
   *
   * WHY SERIALIZABLE USER (NOT FIREBASE USER)?
   * The raw Firebase User object causes Redux to crash because:
   * - It contains methods (getIdToken, reload, etc.)
   * - It has circular references
   * - Redux can't serialize it to JSON
   *
   * SerializableUser contains only the data we need:
   * - uid: Unique user ID
   * - email: User's email address
   * - displayName: User's display name (set via updateProfile)
   * - photoURL: User's profile photo URL
   * - emailVerified: Whether email is verified
   *
   * For methods like getIdToken(), use auth.currentUser directly.
   * For custom data, use Firestore!
   */
  user: SerializableUser | null | undefined;

  /**
   * Loading state
   *
   * True when an auth operation is in progress:
   * - Signing in
   * - Signing up
   * - Signing out
   * - Resetting password
   *
   * Use this to show loading spinners and disable buttons.
   */
  loading: boolean;

  /**
   * Initialization state
   *
   * False until we've set up the auth state listener.
   * This happens once when the app starts.
   *
   * PREVENTS FLASH:
   * Without this, app might show:
   * 1. Welcome screen (user = null)
   * 2. Then jump to Home (user found)
   *
   * With initialized:
   * 1. Show loading until initialized = true
   * 2. Then show correct screen based on user state
   *
   * NOTE: With Firebase, initialization is handled by onAuthStateChanged
   * listener in _layout.tsx, not by a thunk like in Supabase.
   */
  initialized: boolean;

  /**
   * Error state
   *
   * Stores error messages from failed operations.
   * null means no error.
   *
   * Common Firebase Auth errors:
   * - "auth/user-not-found" → "No user found with this email"
   * - "auth/wrong-password" → "Incorrect password"
   * - "auth/email-already-in-use" → "Email already registered"
   * - "auth/weak-password" → "Password is too weak"
   * - "auth/invalid-email" → "Invalid email address"
   * - "auth/too-many-requests" → "Too many attempts, try later"
   */
  error: string | null;
}

/**
 * Initial State
 *
 * The starting state when the app loads.
 *
 * - user: undefined (haven't checked yet)
 * - loading: false (not loading)
 * - initialized: false (haven't set up listener yet)
 * - error: null (no error)
 *
 * NOTE: No session field! Firebase handles tokens internally.
 */
const initialState: AuthState = {
  user: undefined,
  loading: false,
  initialized: false,
  error: null,
};

/**
 * =============================================================================
 * HELPER FUNCTION: Map Firebase Error Codes to User-Friendly Messages
 * =============================================================================
 *
 * Firebase returns error codes like "auth/user-not-found".
 * We map these to user-friendly messages for better UX.
 *
 * WHY THIS HELPER?
 * - Firebase error messages are technical
 * - Users need clear, helpful messages
 * - Centralized mapping is easier to maintain
 */
function getFirebaseErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    // Sign In errors
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',

    // Sign Up errors
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/operation-not-allowed': 'Email/password sign up is not enabled.',

    // General errors
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/internal-error': 'An internal error occurred. Please try again.',
    'auth/invalid-credential': 'Invalid credentials. Please try again.',
  };

  return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
}

/**
 * =============================================================================
 * ASYNC THUNKS
 * =============================================================================
 *
 * createAsyncThunk creates async actions that:
 * 1. Dispatch a "pending" action when started
 * 2. Run your async code (Firebase Auth call)
 * 3. Dispatch "fulfilled" on success or "rejected" on failure
 *
 * This eliminates the try/catch/finally pattern from our components!
 *
 * NOTE ON INITIALIZATION:
 * Unlike Supabase, we don't need an initializeAuth thunk!
 * Firebase uses the onAuthStateChanged listener pattern, which we set up
 * in _layout.tsx. The listener automatically fires with the current user
 * (or null) when subscribed, handling initialization for us.
 */

/**
 * Sign In Credentials Type
 *
 * TypeScript interface for signIn arguments.
 * This ensures type safety when dispatching the thunk.
 */
interface SignInCredentials {
  email: string;
  password: string;
}

/**
 * Sign In Thunk
 *
 * Authenticates a user with email and password using Firebase Auth.
 *
 * FLOW:
 * 1. Component dispatches: dispatch(signIn({ email, password }))
 * 2. Redux dispatches signIn.pending → loading = true
 * 3. Firebase Auth verifies credentials
 * 4. Success: Redux dispatches signIn.fulfilled → user set
 * 5. Failure: Redux dispatches signIn.rejected → error set
 *
 * FIREBASE VS SUPABASE:
 * - Supabase: signInWithPassword({ email, password })
 * - Firebase: signInWithEmailAndPassword(auth, email, password)
 *
 * Firebase returns a UserCredential object containing the User.
 *
 * @param credentials - { email, password }
 * @returns { user } on success
 * @throws Error on failure
 */
export const signIn = createAsyncThunk(
  'auth/signIn',
  async (credentials: SignInCredentials, { rejectWithValue }) => {
    const { email, password } = credentials;

    try {
      /**
       * signInWithEmailAndPassword
       *
       * Firebase Auth method to sign in with email and password.
       * Returns a UserCredential object containing:
       * - user: The signed-in Firebase User object
       * - providerId: Always 'password' for email/password auth
       * - operationType: 'signIn'
       *
       * The auth tokens are automatically stored in AsyncStorage
       * (configured in firebase.ts with getReactNativePersistence).
       */
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      /**
       * Return the SERIALIZED user object
       *
       * IMPORTANT: We serialize the Firebase User before returning!
       * This converts the complex Firebase User object into a plain object
       * that Redux can safely store without crashing.
       *
       * NOTE: We don't return session like with Supabase!
       * Firebase manages tokens internally.
       *
       * The onAuthStateChanged listener in _layout.tsx will also fire,
       * but having the user here lets our fulfilled reducer set state immediately.
       */
      return { user: serializeUser(userCredential.user) };
    } catch (error: unknown) {
      /**
       * Handle Firebase Auth Errors
       *
       * Firebase errors have a 'code' property like 'auth/user-not-found'.
       * We map these to user-friendly messages.
       */
      const firebaseError = error as { code?: string; message?: string };
      const errorMessage = firebaseError.code
        ? getFirebaseErrorMessage(firebaseError.code)
        : 'Failed to sign in';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Sign Up Credentials Type
 *
 * Similar to SignInCredentials but includes optional displayName.
 *
 * NOTE ON METADATA:
 * - Supabase: Metadata stored in user_metadata field during signup
 * - Firebase: displayName set via updateProfile after signup
 *
 * For other custom data (e.g., user preferences), use Firestore!
 */
interface SignUpCredentials {
  email: string;
  password: string;
  displayName?: string;
}

/**
 * Sign Up Thunk
 *
 * Creates a new user account in Firebase Auth.
 *
 * FLOW:
 * 1. Create user with createUserWithEmailAndPassword
 * 2. If displayName provided, update profile with updateProfile
 * 3. Return the user
 *
 * FIREBASE SIGN UP PROCESS:
 * - Creates user in Firebase Auth
 * - User can immediately sign in (no email verification required by default)
 * - To require email verification, use sendEmailVerification() after signup
 *
 * @param credentials - { email, password, displayName }
 * @returns { user } on success
 */
export const signUp = createAsyncThunk(
  'auth/signUp',
  async (credentials: SignUpCredentials, { rejectWithValue }) => {
    const { email, password, displayName } = credentials;

    try {
      /**
       * createUserWithEmailAndPassword
       *
       * Creates a new Firebase Auth user account.
       * - Password must be at least 6 characters
       * - Email must be unique and valid format
       *
       * The user is automatically signed in after creation!
       */
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      /**
       * Update Profile with displayName
       *
       * Firebase separates account creation from profile data.
       * - createUserWithEmailAndPassword: Creates auth account
       * - updateProfile: Sets displayName and photoURL
       *
       * This is different from Supabase where you pass metadata during signup.
       *
       * IMPORTANT: updateProfile doesn't return anything, it modifies in place.
       * After calling it, the user object reflects the changes.
       */
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      /**
       * Return the SERIALIZED user object
       *
       * After updateProfile, the user object has the updated displayName.
       * We serialize it to make it safe for Redux storage.
       */
      return { user: serializeUser(user) };
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      const errorMessage = firebaseError.code
        ? getFirebaseErrorMessage(firebaseError.code)
        : 'Failed to sign up';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Sign Out Thunk
 *
 * Logs out the current user and clears the session.
 *
 * WHAT FIREBASE DOES:
 * 1. Clears auth tokens from storage (AsyncStorage)
 * 2. Triggers onAuthStateChanged with null
 * 3. User is completely signed out
 *
 * WHAT WE DO:
 * 1. Clear user from Redux state
 * 2. Navigation responds to state change
 * 3. User sees auth screens (handled by root layout)
 *
 * FIREBASE VS SUPABASE:
 * - Supabase: supabase.auth.signOut()
 * - Firebase: signOut(auth)
 */
export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      /**
       * firebaseSignOut
       *
       * We imported signOut as firebaseSignOut to avoid naming conflict
       * with our thunk. It signs out the current user from Firebase Auth.
       *
       * After this:
       * - Tokens are cleared from AsyncStorage
       * - onAuthStateChanged fires with null
       * - User must sign in again to access protected content
       */
      await firebaseSignOut(auth);
      return undefined;
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      return rejectWithValue(firebaseError.message || 'Failed to sign out');
    }
  }
);

/**
 * Reset Password Thunk
 *
 * Sends a password reset email to the user.
 *
 * FLOW:
 * 1. User enters email on "Forgot Password" screen
 * 2. We call resetPassword({ email })
 * 3. Firebase sends reset email with link
 * 4. User clicks link → Opens Firebase hosted page to reset password
 * 5. After reset, user can sign in with new password
 *
 * NOTE ON DEEP LINKS:
 * - Supabase: We could specify a redirectTo URL for deep linking
 * - Firebase: Uses Firebase Dynamic Links for deep linking (more setup required)
 *
 * For now, the default Firebase reset flow works great.
 * Deep links can be added later using Firebase Dynamic Links.
 *
 * @param payload - { email }
 */
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (payload: { email: string }, { rejectWithValue }) => {
    const { email } = payload;

    try {
      /**
       * sendPasswordResetEmail
       *
       * Sends a password reset email to the specified address.
       * - Email must exist in Firebase Auth
       * - User receives email with reset link
       * - Link expires after a period (configurable in Firebase Console)
       *
       * Firebase Auth settings for password reset can be customized:
       * - Email template (Firebase Console > Authentication > Templates)
       * - Expiration time
       * - Action URL (for custom reset page)
       */
      await sendPasswordResetEmail(auth, email);
      return undefined;
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      const errorMessage = firebaseError.code
        ? getFirebaseErrorMessage(firebaseError.code)
        : 'Failed to send reset email';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * =============================================================================
 * AUTH SLICE
 * =============================================================================
 *
 * createSlice generates:
 * - Action creators (authSlice.actions)
 * - A reducer function (authSlice.reducer)
 * - Action types (automatically named auth/actionName)
 *
 * The reducers object defines synchronous state updates.
 * The extraReducers builder handles async thunk actions.
 */
const authSlice = createSlice({
  /**
   * Slice Name
   *
   * Used as prefix for action types: 'auth/setUser', 'auth/clearError', etc.
   * Also determines the key in the root state: state.auth
   */
  name: 'auth',

  /**
   * Initial State
   *
   * The starting state for this slice.
   */
  initialState,

  /**
   * Reducers
   *
   * Synchronous state updates.
   * Each reducer becomes an action creator: authSlice.actions.clearError()
   *
   * IMMER MAGIC:
   * Redux Toolkit uses Immer, so you can "mutate" state directly!
   * Immer converts these mutations into immutable updates.
   *
   * Without Immer (vanilla Redux):
   * return { ...state, error: null };
   *
   * With Immer (Redux Toolkit):
   * state.error = null;  // This is safe!
   */
  reducers: {
    /**
     * Clear Error
     *
     * Resets the error state to null.
     * Call this when starting a new operation or dismissing an error.
     *
     * USAGE:
     * dispatch(clearError());
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Set Auth State
     *
     * Directly sets user and marks auth as initialized.
     * Used by the auth state listener (onAuthStateChanged) in _layout.tsx.
     *
     * WHY THIS EXISTS:
     * Firebase's onAuthStateChanged listener fires when:
     * - App starts (with current user or null)
     * - User signs in
     * - User signs out
     * - Token is refreshed
     *
     * We need to sync Redux state with these changes.
     *
     * SERIALIZATION:
     * The listener receives a Firebase User object, which is NOT serializable.
     * We serialize it here before storing in Redux state.
     *
     * USAGE (in _layout.tsx):
     * onAuthStateChanged(auth, (user) => {
     *   dispatch(setAuthState({ user }));
     * });
     */
    setAuthState: (
      state,
      action: PayloadAction<{ user: User | null }>
    ) => {
      // Serialize the Firebase User before storing
      // If user is null, store null (not logged in)
      state.user = action.payload.user ? serializeUser(action.payload.user) : null;
      state.initialized = true;
    },
  },

  /**
   * Extra Reducers
   *
   * Handles actions from async thunks.
   * Each thunk generates three actions:
   * - pending: When the async operation starts
   * - fulfilled: When it succeeds
   * - rejected: When it fails
   *
   * BUILDER PATTERN:
   * builder.addCase() lets us handle each action type.
   * TypeScript infers the action.payload type automatically!
   */
  extraReducers: (builder) => {
    builder
      // =========================================================================
      // SIGN IN
      // =========================================================================
      .addCase(signIn.pending, (state) => {
        /**
         * Sign In Started
         *
         * Clear any previous error and set loading = true.
         * Components can show a loading spinner.
         */
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        /**
         * Sign In Succeeded
         *
         * action.payload is { user } from the thunk.
         * Set user, clear loading.
         * Navigation will respond to user being set.
         *
         * NOTE: No session to set! Firebase handles tokens internally.
         */
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(signIn.rejected, (state, action) => {
        /**
         * Sign In Failed
         *
         * action.payload is the error message (from rejectWithValue).
         * Set error state so component can display it.
         */
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to sign in';
      })

      // =========================================================================
      // SIGN UP
      // =========================================================================
      .addCase(signUp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        /**
         * Sign Up Succeeded
         *
         * User is automatically signed in after creation in Firebase.
         * (Unlike Supabase where email verification might be required)
         */
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to sign up';
      })

      // =========================================================================
      // SIGN OUT
      // =========================================================================
      .addCase(signOut.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signOut.fulfilled, (state) => {
        /**
         * Sign Out Succeeded
         *
         * Clear user state.
         * Keep initialized = true (we know there's no user).
         * Navigation will show auth screens.
         */
        state.loading = false;
        state.user = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        /**
         * Sign Out Failed
         *
         * This is rare - usually still works locally.
         * Clear auth state anyway for safety.
         */
        state.loading = false;
        state.user = null;
        state.error = (action.payload as string) ?? 'Failed to sign out';
      })

      // =========================================================================
      // RESET PASSWORD
      // =========================================================================
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        /**
         * Reset Email Sent
         *
         * Just clear loading. Component should show success message.
         */
        state.loading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to send reset email';
      });
  },
});

/**
 * Export Actions
 *
 * These are the synchronous actions from the reducers object.
 * Components can dispatch these directly.
 *
 * USAGE:
 * import { clearError, setAuthState } from '../store/slices/authSlice';
 * dispatch(clearError());
 */
export const { clearError, setAuthState } = authSlice.actions;

/**
 * Export Reducer
 *
 * The reducer function handles all actions for this slice.
 * This is imported by store/index.ts to add to the store.
 */
export default authSlice.reducer;

/**
 * LEARNING NOTES - FIREBASE AUTH MIGRATION:
 *
 * 1. NO MORE SESSION OBJECT
 *
 *    Supabase:
 *    - Stored user AND session in state
 *    - Session contained access_token, refresh_token
 *    - Had to pass session to some operations
 *
 *    Firebase:
 *    - Only store user in state
 *    - Firebase manages tokens internally (AsyncStorage)
 *    - Auth instance (from firebase.ts) handles everything
 *
 * 2. DIFFERENT USER OBJECTS
 *
 *    Supabase User:
 *    - id, email, user_metadata, app_metadata
 *    - Custom data in user_metadata
 *
 *    Firebase User:
 *    - uid, email, displayName, photoURL, emailVerified
 *    - Custom data should go in Firestore (a separate database)
 *
 * 3. AUTH METHOD SIGNATURES
 *
 *    Supabase:
 *    supabase.auth.signInWithPassword({ email, password })
 *
 *    Firebase:
 *    signInWithEmailAndPassword(auth, email, password)
 *
 *    Firebase requires passing the auth instance to each method.
 *
 * 4. INITIALIZATION PATTERN
 *
 *    Supabase:
 *    - Called getSession() to check for existing session
 *    - Then set up onAuthStateChange listener
 *
 *    Firebase:
 *    - Just set up onAuthStateChanged listener
 *    - It fires immediately with current user (or null)
 *    - Handles both initialization AND state changes
 *
 * 5. ERROR HANDLING
 *
 *    Supabase:
 *    - Returns { data, error } object
 *    - Check if (error) throw error
 *
 *    Firebase:
 *    - Throws errors (try/catch pattern)
 *    - Errors have code and message properties
 *    - Error codes like 'auth/user-not-found'
 *
 * 6. PROFILE DATA
 *
 *    Supabase:
 *    - Pass metadata during signup: signUp({ data: { full_name } })
 *
 *    Firebase:
 *    - Create account first, then updateProfile({ displayName })
 *    - For more data, use Firestore (we'll add this later!)
 *
 * COMMON PATTERNS:
 *
 * Dispatching sign in:
 * dispatch(signIn({ email, password }));
 *
 * Checking if operation succeeded:
 * const result = await dispatch(signIn({ email, password }));
 * if (signIn.fulfilled.match(result)) {
 *   // Success!
 * }
 *
 * Responding to auth state change (in _layout.tsx):
 * onAuthStateChanged(auth, (user) => {
 *   dispatch(setAuthState({ user }));
 * });
 */
