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

// Import our Firebase services for profile image operations
// These handle the actual file upload/delete and database updates
import { uploadProfileImage, deleteProfileImage, getStorageErrorMessage } from '../../services/storage';
import { updateUserProfileImage as updateFirestoreProfileImage } from '../../services/firestore';

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
 * - profileImageLoading: Separate loading state for profile image operations
 * - profileImageError: Separate error state for profile image operations
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

  /**
   * Profile Image Loading State
   *
   * Separate from the main 'loading' state because:
   * - Profile image operations can happen independently from auth operations
   * - We want to show a loading indicator specifically on the avatar
   * - The user can still interact with other parts of the app during upload
   *
   * True when:
   * - Uploading a new profile image
   * - Removing the current profile image
   *
   * WHY SEPARATE LOADING STATES?
   * Think of it like this: if you're uploading a profile picture, you don't
   * want the entire app to appear "loading". You just want the avatar
   * component to show a spinner while the rest of the screen stays interactive.
   *
   * This pattern is called "localized loading states" - each operation
   * has its own loading indicator.
   */
  profileImageLoading: boolean;

  /**
   * Profile Image Error State
   *
   * Stores error messages from failed profile image operations.
   * null means no error.
   *
   * Separate from the main 'error' state because:
   * - Profile image errors should be displayed differently (maybe a toast)
   * - We don't want an image upload error to interfere with auth errors
   * - Allows the user to dismiss image errors independently
   *
   * Common errors:
   * - "Failed to upload profile image: Network error"
   * - "Failed to delete profile image: Permission denied"
   * - "You don't have permission to access this file"
   */
  profileImageError: string | null;
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
 * - profileImageLoading: false (not uploading)
 * - profileImageError: null (no image error)
 *
 * NOTE: No session field! Firebase handles tokens internally.
 */
const initialState: AuthState = {
  user: undefined,
  loading: false,
  initialized: false,
  error: null,
  profileImageLoading: false,
  profileImageError: null,
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
 * PROFILE IMAGE THUNKS
 * =============================================================================
 *
 * These thunks handle profile image upload and deletion.
 * They coordinate multiple services to ensure data consistency:
 *
 * 1. Firebase Storage: Stores the actual image file
 * 2. Firebase Auth: Updates the user's photoURL property
 * 3. Firestore: Updates the user document with the new photoURL
 *
 * WHY UPDATE ALL THREE?
 * - Firebase Auth photoURL: Used by Firebase services and onAuthStateChanged
 * - Firestore photoURL: For app-specific queries and additional user data
 * - Both should stay in sync to avoid confusion
 *
 * ORDER OF OPERATIONS:
 * For upload: Storage → Get URL → Auth Update → Firestore Update
 * For delete: Storage → Auth Update → Firestore Update
 *
 * This order ensures:
 * - The file is uploaded before we try to reference it
 * - URLs are only saved after the file exists
 * - If any step fails, we have a clear point of failure
 */

/**
 * Update Profile Image Payload Type
 *
 * The imageUri is the local file path from the image picker.
 * In React Native, this is typically a file:// URI.
 *
 * Example: "file:///var/mobile/Containers/Data/Application/.../image.jpg"
 */
interface UpdateProfileImagePayload {
  imageUri: string;
}

/**
 * Update Profile Image Thunk
 *
 * Uploads a new profile image and updates all relevant places.
 *
 * FLOW:
 * 1. Dispatch updateProfileImage({ imageUri })
 * 2. Redux dispatches pending → profileImageLoading = true
 * 3. Upload image to Firebase Storage
 * 4. Get the download URL
 * 5. Update Firebase Auth profile with new photoURL
 * 6. Update Firestore user document with new photoURL
 * 7. Redux dispatches fulfilled → user.photoURL updated
 *
 * WHY ALL THESE STEPS?
 * - Storage: Actual file needs to be somewhere accessible
 * - Auth: photoURL is part of the Firebase User object
 * - Firestore: Our app's user profile data
 *
 * LEARNING NOTE: Async Thunk with Multiple Service Calls
 * This thunk coordinates multiple async operations.
 * If any fails, the whole operation is rejected.
 * This is called "saga-like" coordination in one function.
 *
 * @param payload - { imageUri: string } - Local path to the image
 * @returns { photoURL } - The new download URL
 */
export const updateUserProfileImage = createAsyncThunk(
  'auth/updateProfileImage',
  async (payload: UpdateProfileImagePayload, { getState, rejectWithValue }) => {
    const { imageUri } = payload;

    try {
      /**
       * Step 1: Get the current user
       *
       * We need the user's UID to know where to store the image.
       * getState() gives us access to the entire Redux state.
       *
       * TYPE CASTING:
       * getState() returns unknown by default.
       * We cast it to our RootState shape to access state.auth.
       *
       * Note: We import RootState type inline to avoid circular dependency.
       * Alternatively, we could define the type here.
       */
      const state = getState() as { auth: AuthState };
      const user = state.auth.user;

      // Guard: Can't update profile if not logged in
      if (!user) {
        return rejectWithValue('You must be signed in to update your profile image.');
      }

      /**
       * Step 2: Upload image to Firebase Storage
       *
       * This function (from storage.ts):
       * - Converts the local URI to a Blob
       * - Uploads to profile-images/{userId}/avatar.jpg
       * - Returns the public download URL
       *
       * If the user already had a profile image, this OVERWRITES it.
       * Firebase Storage replaces files with the same path.
       */
      const downloadURL = await uploadProfileImage(user.uid, imageUri);

      /**
       * Step 3: Update Firebase Auth profile
       *
       * updateProfile is a Firebase Auth method that updates:
       * - displayName (not changing here)
       * - photoURL (the new image URL)
       *
       * This ensures auth.currentUser.photoURL is up to date.
       * The onAuthStateChanged listener will pick up this change.
       *
       * IMPORTANT: auth.currentUser vs state.auth.user
       * - auth.currentUser: Live Firebase User object (has methods)
       * - state.auth.user: Serialized snapshot in Redux (plain data)
       *
       * We update auth.currentUser, then return new data for Redux.
       */
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, { photoURL: downloadURL });
      }

      /**
       * Step 4: Update Firestore user document
       *
       * This keeps our Firestore data in sync with Auth.
       * Some apps only use one or the other, but having both
       * gives us flexibility for future features.
       *
       * We renamed the import to updateFirestoreProfileImage to avoid
       * collision with our thunk name (updateUserProfileImage).
       */
      await updateFirestoreProfileImage(user.uid, downloadURL);

      /**
       * Step 5: Return the new photoURL
       *
       * The fulfilled reducer will use this to update state.auth.user.photoURL.
       * This ensures Redux state matches what we just saved.
       */
      return { photoURL: downloadURL };

    } catch (error: unknown) {
      /**
       * Error Handling
       *
       * If any step fails, we catch the error here.
       * Firebase Storage errors have a 'code' property.
       * We use our helper to get a user-friendly message.
       */
      console.error('Error updating profile image:', error);

      const storageError = error as { code?: string; message?: string };
      const errorMessage = storageError.code
        ? getStorageErrorMessage(storageError.code)
        : storageError.message || 'Failed to update profile image';

      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Remove Profile Image Thunk
 *
 * Removes the user's profile image from all places.
 *
 * FLOW:
 * 1. Dispatch removeProfileImage()
 * 2. Redux dispatches pending → profileImageLoading = true
 * 3. Delete image from Firebase Storage
 * 4. Update Firebase Auth profile with photoURL = null
 * 5. Update Firestore user document with photoURL = null
 * 6. Redux dispatches fulfilled → user.photoURL = null
 *
 * WHY ALLOW NULL PHOTOS?
 * - Not all users want a profile picture
 * - User might want to remove an existing picture
 * - Privacy: User can remove identifiable photos
 *
 * The Avatar component should handle null/undefined photoURL
 * by showing a fallback (initials, default icon, etc.)
 *
 * @returns undefined (no payload needed)
 */
export const removeUserProfileImage = createAsyncThunk(
  'auth/removeProfileImage',
  async (_, { getState, rejectWithValue }) => {
    try {
      /**
       * Step 1: Get the current user
       */
      const state = getState() as { auth: AuthState };
      const user = state.auth.user;

      if (!user) {
        return rejectWithValue('You must be signed in to remove your profile image.');
      }

      /**
       * Step 2: Delete image from Firebase Storage
       *
       * This function handles the case where no image exists.
       * It silently succeeds if there's nothing to delete.
       */
      await deleteProfileImage(user.uid);

      /**
       * Step 3: Update Firebase Auth profile
       *
       * Set photoURL to null to clear the profile image.
       */
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, { photoURL: null });
      }

      /**
       * Step 4: Update Firestore user document
       *
       * Set photoURL to null in Firestore as well.
       */
      await updateFirestoreProfileImage(user.uid, null);

      /**
       * Step 5: Return success
       *
       * The fulfilled reducer will set state.auth.user.photoURL = null.
       */
      return undefined;

    } catch (error: unknown) {
      console.error('Error removing profile image:', error);

      const storageError = error as { code?: string; message?: string };
      const errorMessage = storageError.code
        ? getStorageErrorMessage(storageError.code)
        : storageError.message || 'Failed to remove profile image';

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

    /**
     * Clear Profile Image Error
     *
     * Resets the profile image error state to null.
     * Call this when dismissing a profile image error or before a new attempt.
     *
     * WHY A SEPARATE ACTION FROM clearError?
     * - Profile image errors are independent from auth errors
     * - A user might dismiss a "failed to upload" error and try again
     * - We don't want to accidentally clear auth errors when clearing image errors
     *
     * USAGE:
     * dispatch(clearProfileImageError());
     *
     * EXAMPLE SCENARIO:
     * 1. User tries to upload an image → fails due to network
     * 2. App shows an error toast with "Dismiss" button
     * 3. User taps dismiss → dispatch(clearProfileImageError())
     * 4. Error toast disappears
     * 5. User tries again (now the error is already cleared)
     */
    clearProfileImageError: (state) => {
      state.profileImageError = null;
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
      })

      // =========================================================================
      // UPDATE PROFILE IMAGE
      // =========================================================================
      /**
       * Update Profile Image Reducers
       *
       * Handle the three states of the updateUserProfileImage async thunk.
       *
       * IMPORTANT: We use profileImageLoading and profileImageError here,
       * NOT the main loading/error states. This keeps profile image
       * operations independent from auth operations.
       *
       * WHY THIS MATTERS:
       * Imagine a user is uploading a profile image and gets signed out
       * by another session. If we used the same loading state, the UI
       * would be confused about what's happening.
       */
      .addCase(updateUserProfileImage.pending, (state) => {
        /**
         * Upload Started
         *
         * Set profileImageLoading = true so the Avatar component
         * can show a spinner or loading overlay.
         *
         * Clear any previous profile image errors.
         */
        state.profileImageLoading = true;
        state.profileImageError = null;
      })
      .addCase(updateUserProfileImage.fulfilled, (state, action) => {
        /**
         * Upload Succeeded
         *
         * action.payload contains { photoURL: string }
         *
         * We update the user's photoURL in Redux state.
         * This triggers a re-render of components using this data.
         *
         * LEARNING NOTE: Immer Deep Updates
         * With Immer, we can directly "mutate" nested objects.
         * This code looks like mutation but Immer makes it immutable!
         *
         * Without Immer, we'd have to write:
         * return {
         *   ...state,
         *   profileImageLoading: false,
         *   user: state.user ? { ...state.user, photoURL: action.payload.photoURL } : null
         * };
         *
         * With Immer:
         * state.user.photoURL = action.payload.photoURL;  // Much simpler!
         */
        state.profileImageLoading = false;
        if (state.user) {
          state.user.photoURL = action.payload.photoURL;
        }
      })
      .addCase(updateUserProfileImage.rejected, (state, action) => {
        /**
         * Upload Failed
         *
         * Set profileImageError with the error message.
         * The UI can show this in a toast or alert.
         *
         * The user's photoURL remains unchanged (their old image is still there).
         */
        state.profileImageLoading = false;
        state.profileImageError = (action.payload as string) ?? 'Failed to update profile image';
      })

      // =========================================================================
      // REMOVE PROFILE IMAGE
      // =========================================================================
      /**
       * Remove Profile Image Reducers
       *
       * Handle the three states of the removeUserProfileImage async thunk.
       * Very similar to update, but we set photoURL to null on success.
       */
      .addCase(removeUserProfileImage.pending, (state) => {
        /**
         * Removal Started
         *
         * Show loading state while we delete the image.
         */
        state.profileImageLoading = true;
        state.profileImageError = null;
      })
      .addCase(removeUserProfileImage.fulfilled, (state) => {
        /**
         * Removal Succeeded
         *
         * Set photoURL to null to indicate no profile image.
         * The Avatar component should show a fallback (initials, icon).
         */
        state.profileImageLoading = false;
        if (state.user) {
          state.user.photoURL = null;
        }
      })
      .addCase(removeUserProfileImage.rejected, (state, action) => {
        /**
         * Removal Failed
         *
         * The image might still exist in Storage.
         * User's photoURL remains unchanged.
         */
        state.profileImageLoading = false;
        state.profileImageError = (action.payload as string) ?? 'Failed to remove profile image';
      });
  },
});

/**
 * Export Actions
 *
 * These are the synchronous actions from the reducers object.
 * Components can dispatch these directly.
 *
 * ACTIONS:
 * - clearError: Clear the main auth error state
 * - clearProfileImageError: Clear the profile image error state
 * - setAuthState: Sync Redux with Firebase auth state (used by onAuthStateChanged)
 *
 * USAGE:
 * import { clearError, setAuthState, clearProfileImageError } from '../store/slices/authSlice';
 * dispatch(clearError());
 * dispatch(clearProfileImageError());
 */
export const { clearError, setAuthState, clearProfileImageError } = authSlice.actions;

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
 *
 * =============================================================================
 * PROFILE IMAGE MANAGEMENT (ADDED IN PHASE 5)
 * =============================================================================
 *
 * Profile image operations involve coordination between multiple Firebase services:
 *
 * SERVICES INVOLVED:
 * 1. Firebase Storage - Stores the actual image file
 * 2. Firebase Auth - User's photoURL property
 * 3. Firestore - User document with photoURL field
 *
 * WHY ALL THREE?
 * - Storage: Where the actual bytes live (the image file)
 * - Auth photoURL: Used by Firebase services and triggers onAuthStateChanged
 * - Firestore: For app-specific queries and additional user data
 *
 * DATA FLOW FOR UPLOAD:
 * 1. User picks image → ImagePicker returns local URI (file://...)
 * 2. dispatch(updateUserProfileImage({ imageUri }))
 * 3. Thunk: Upload to Storage → Get download URL
 * 4. Thunk: Update Firebase Auth profile
 * 5. Thunk: Update Firestore document
 * 6. Reducer: Update state.auth.user.photoURL
 * 7. UI: Avatar component re-renders with new image
 *
 * DATA FLOW FOR REMOVE:
 * 1. User taps "Remove Photo"
 * 2. dispatch(removeUserProfileImage())
 * 3. Thunk: Delete from Storage (if exists)
 * 4. Thunk: Update Firebase Auth profile (photoURL = null)
 * 5. Thunk: Update Firestore document (photoURL = null)
 * 6. Reducer: Set state.auth.user.photoURL = null
 * 7. UI: Avatar component shows fallback (initials/icon)
 *
 * LOCALIZED LOADING STATES:
 * We use profileImageLoading instead of the main loading state.
 * This allows the user to interact with other parts of the app
 * while an image is uploading in the background.
 *
 * USAGE EXAMPLES:
 *
 * Upload a new profile image:
 * const result = await dispatch(updateUserProfileImage({ imageUri }));
 * if (updateUserProfileImage.fulfilled.match(result)) {
 *   console.log('Upload succeeded!');
 * }
 *
 * Remove the profile image:
 * await dispatch(removeUserProfileImage());
 *
 * Clear profile image error:
 * dispatch(clearProfileImageError());
 *
 * Access state in components:
 * const { profileImageLoading, profileImageError } = useAppSelector(state => state.auth);
 *
 * PHOTOURL SYNC WITH onAuthStateChanged:
 * When updateProfile() is called on Firebase Auth, it MAY trigger
 * onAuthStateChanged (implementation varies). Our setAuthState reducer
 * handles this by re-serializing the user, which includes the new photoURL.
 * This ensures Redux state stays in sync with Firebase Auth.
 */
