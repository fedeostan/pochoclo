/**
 * Authentication Context
 *
 * This file provides authentication state and functions to the entire app
 * using React's Context API. It's the central hub for all auth-related logic.
 *
 * WHAT IS REACT CONTEXT?
 * Context is React's way of sharing data across the entire component tree
 * without passing props down manually at every level (called "prop drilling").
 *
 * Without Context (prop drilling):
 * App → Layout → Screen → Component → Button (pass user through each level)
 *
 * With Context:
 * App wraps with AuthProvider → Any component can use useAuth() to get user
 *
 * WHY USE CONTEXT FOR AUTH?
 * Authentication state is needed throughout the app:
 * - Screens need to know if user is logged in
 * - Components need user data (name, email)
 * - Navigation needs auth state (show auth screens vs app screens)
 * - Multiple screens need signIn/signOut functions
 *
 * Context makes this data available everywhere without prop drilling.
 *
 * HOW THIS WORKS:
 * 1. AuthProvider wraps the app (in app/_layout.tsx)
 * 2. Provider manages auth state (user, session, loading)
 * 3. Provider listens to Supabase auth changes
 * 4. Any component calls useAuth() to access state/functions
 * 5. When auth changes, all components re-render with new state
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

/**
 * AuthContextType Interface
 *
 * Defines the shape of our auth context.
 * This is what you get when you call useAuth().
 *
 * TYPESCRIPT BENEFIT:
 * Your IDE will autocomplete these properties and TypeScript will
 * catch typos like useAuth().usr instead of useAuth().user
 */
interface AuthContextType {
  /**
   * Current authenticated user
   * - null: Not logged in
   * - User object: Logged in
   * - undefined: Still checking (loading)
   *
   * User contains: id, email, user_metadata, etc.
   */
  user: User | null | undefined;

  /**
   * Current session
   * Session contains:
   * - access_token: JWT token for API requests
   * - refresh_token: Token to get new access token
   * - expires_at: When session expires
   *
   * We mostly use 'user', but session is needed for:
   * - Manual API calls
   * - Token refresh logic
   * - Checking expiration
   */
  session: Session | null;

  /**
   * Whether auth is currently loading
   * True during:
   * - Initial app load (checking for existing session)
   * - Sign in/sign up operations
   * - Sign out operations
   *
   * Use this to show loading spinners
   */
  loading: boolean;

  /**
   * Whether auth has been initialized
   * False until we've checked for an existing session.
   *
   * Difference from loading:
   * - initialized: Have we checked for a session? (happens once at startup)
   * - loading: Is an auth operation in progress? (happens multiple times)
   *
   * Use initialized to prevent flashing screens:
   * - Don't show Welcome screen until initialized = true
   * - Otherwise, logged-in users see Welcome screen briefly
   */
  initialized: boolean;

  /**
   * Sign In Function
   *
   * Authenticates a user with email and password.
   * Returns the user object on success, throws error on failure.
   *
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise<User> - The authenticated user
   * @throws AuthError - If credentials are invalid
   */
  signIn: (email: string, password: string) => Promise<User>;

  /**
   * Sign Up Function
   *
   * Creates a new user account with email and password.
   * Optionally includes user metadata (like full name).
   *
   * SUPABASE EMAIL VERIFICATION:
   * By default, Supabase sends a verification email.
   * User must click the link before they can sign in.
   *
   * @param email - User's email address
   * @param password - User's password
   * @param metadata - Optional user data (full name, etc.)
   * @returns Promise<User> - The created user
   * @throws AuthError - If email already exists or password is weak
   */
  signUp: (
    email: string,
    password: string,
    metadata?: { full_name?: string }
  ) => Promise<User>;

  /**
   * Sign Out Function
   *
   * Logs out the current user and clears the session.
   * After signOut, user will be redirected to Welcome screen.
   *
   * @returns Promise<void>
   * @throws AuthError - Rarely fails, but handle it anyway
   */
  signOut: () => Promise<void>;

  /**
   * Reset Password Function
   *
   * Sends a password reset email to the user.
   * User clicks link in email to reset password.
   *
   * @param email - Email address to send reset link to
   * @returns Promise<void>
   * @throws AuthError - If email doesn't exist
   */
  resetPassword: (email: string) => Promise<void>;
}

/**
 * Create the Context
 *
 * createContext creates a new context with a default value.
 * We use 'undefined' as default because if someone tries to use
 * useAuth() outside of AuthProvider, we want it to throw an error.
 *
 * This prevents bugs where you forget to wrap your app with AuthProvider.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Props
 *
 * The provider needs children (the components it wraps).
 * ReactNode is TypeScript's type for any React component/element.
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider Component
 *
 * This component:
 * 1. Manages auth state (user, session, loading, initialized)
 * 2. Listens to Supabase auth changes
 * 3. Provides auth functions (signIn, signUp, signOut, resetPassword)
 * 4. Wraps the app to make auth available everywhere
 *
 * USAGE:
 * In app/_layout.tsx:
 * ```tsx
 * <AuthProvider>
 *   <YourApp />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  /**
   * Auth State
   *
   * We use useState to manage auth state in React.
   * When state changes, React re-renders all components using that state.
   *
   * STATE EXPLANATION:
   * - user: undefined (initial) → null (checked, not logged in) → User (logged in)
   * - session: null (no session) → Session (logged in)
   * - loading: false (not loading) → true (loading) → false (done)
   * - initialized: false (haven't checked) → true (checked for existing session)
   */
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  /**
   * Initialize Auth on Mount
   *
   * useEffect runs when the component mounts (appears on screen).
   * This effect:
   * 1. Checks for an existing session (user might already be logged in)
   * 2. Sets up a listener for auth changes (login, logout, token refresh)
   *
   * SUPABASE SESSION PERSISTENCE:
   * Supabase stores the session in AsyncStorage (configured in supabase.ts).
   * When app restarts, getSession() retrieves the stored session.
   * This keeps users logged in across app restarts!
   *
   * AUTH STATE LISTENER:
   * onAuthStateChange() is called whenever auth state changes:
   * - User signs in → SIGNED_IN event
   * - User signs out → SIGNED_OUT event
   * - Token refreshes → TOKEN_REFRESHED event
   * - Password reset → PASSWORD_RECOVERY event
   *
   * This keeps our UI in sync with Supabase's auth state.
   */
  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setInitialized(true); // We've now checked for a session
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      /**
       * When auth state changes:
       * - Update session and user in our state
       * - React will re-render all components using useAuth()
       * - Navigation will update (show auth screens vs app screens)
       *
       * Events we handle:
       * - SIGNED_IN: User just logged in
       * - SIGNED_OUT: User just logged out
       * - TOKEN_REFRESHED: Access token was refreshed
       * - USER_UPDATED: User updated their profile
       * - PASSWORD_RECOVERY: User clicked password reset link
       */
      setSession(session);
      setUser(session?.user ?? null);
      setInitialized(true);
    });

    // Cleanup function
    // When component unmounts, unsubscribe from auth changes
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array = run once on mount

  /**
   * Sign In Function
   *
   * Authenticates user with Supabase using email and password.
   *
   * FLOW:
   * 1. Set loading = true (show loading spinner)
   * 2. Call Supabase signInWithPassword()
   * 3. If successful: Return user (state updated by listener)
   * 4. If error: Throw error (caller handles it)
   * 5. Finally: Set loading = false
   *
   * ERROR HANDLING:
   * Supabase returns AuthError with helpful messages:
   * - "Invalid login credentials" (wrong password)
   * - "Email not confirmed" (need to verify email)
   * - "Too many requests" (rate limited)
   *
   * The calling code (sign-in screen) catches and displays these errors.
   */
  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('No user returned from sign in');
      }

      // State will be updated by onAuthStateChange listener
      return data.user;
    } catch (error) {
      // Re-throw error for caller to handle
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign Up Function
   *
   * Creates a new user account in Supabase.
   *
   * FLOW:
   * 1. Set loading = true
   * 2. Call Supabase signUp() with email, password, and metadata
   * 3. Supabase creates user and sends verification email
   * 4. User must click email link to verify (configured in Supabase dashboard)
   * 5. Return user object
   *
   * USER METADATA:
   * Metadata (like full_name) is stored in user.user_metadata
   * We also store it in our profiles table (set up in Phase 4)
   *
   * EMAIL VERIFICATION:
   * Supabase requires email verification by default (good security practice).
   * User can't sign in until they verify their email.
   * The verification email is sent automatically by Supabase.
   *
   * @param email - User's email
   * @param password - User's password
   * @param metadata - Optional user data (full_name, etc.)
   */
  const signUp = async (
    email: string,
    password: string,
    metadata?: { full_name?: string }
  ): Promise<User> => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata, // Store full_name in user_metadata
        },
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('No user returned from sign up');
      }

      /**
       * After sign-up:
       * - User is created but not verified
       * - Verification email is sent
       * - User can't sign in until they verify
       * - We show "Check your email" screen
       *
       * The onAuthStateChange listener won't fire until verification,
       * so we manually update state here to show the verification screen.
       */
      return data.user;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign Out Function
   *
   * Logs out the current user and clears the session.
   *
   * FLOW:
   * 1. Set loading = true
   * 2. Call Supabase signOut()
   * 3. Supabase clears session from AsyncStorage
   * 4. onAuthStateChange listener fires with SIGNED_OUT event
   * 5. State updates: user = null, session = null
   * 6. Navigation redirects to Welcome screen (handled in app/_layout.tsx)
   *
   * CLEANUP:
   * Supabase handles:
   * - Clearing access token
   * - Clearing refresh token
   * - Removing session from AsyncStorage
   * - Invalidating session on server
   */
  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      // State will be updated by onAuthStateChange listener
      // user and session will become null
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset Password Function
   *
   * Sends a password reset email to the user.
   *
   * FLOW:
   * 1. User enters their email on "Forgot Password" screen
   * 2. We call resetPassword(email)
   * 3. Supabase sends reset email with magic link
   * 4. User clicks link in email
   * 5. Link opens app (deep link via "pochoclo://" scheme)
   * 6. App shows password reset screen
   * 7. User enters new password
   *
   * SECURITY:
   * - Reset links expire after a time (configured in Supabase)
   * - Links are one-time use
   * - User must have access to email (proves ownership)
   *
   * NOTE:
   * Phase 7 implements the "request reset email" part.
   * Handling the reset link and updating password is a future enhancement.
   */
  const resetPassword = async (email: string): Promise<void> => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'pochoclo://reset-password', // Deep link to app
      });

      if (error) throw error;

      // Email sent successfully
      // User will receive email with reset link
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Context Value
   *
   * This object is provided to all children.
   * Any component can access these values using useAuth().
   *
   * MEMOIZATION NOTE:
   * In a production app, you'd wrap this in useMemo() to prevent
   * unnecessary re-renders. For this learning project, we keep it
   * simple. If performance becomes an issue, add:
   *
   * const value = useMemo(() => ({
   *   user, session, loading, initialized, signIn, signUp, signOut, resetPassword
   * }), [user, session, loading, initialized]);
   */
  const value: AuthContextType = {
    user,
    session,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  /**
   * Provide the context value to children
   *
   * AuthContext.Provider makes 'value' available to all children.
   * Any child component can access auth state/functions using useAuth().
   */
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 *
 * Custom hook to access auth context.
 * This is the main way components interact with auth.
 *
 * USAGE:
 * ```tsx
 * function MyComponent() {
 *   const { user, signIn, signOut } = useAuth();
 *
 *   if (!user) {
 *     return <Text>Not logged in</Text>;
 *   }
 *
 *   return (
 *     <View>
 *       <Text>Welcome {user.email}</Text>
 *       <Button title="Sign Out" onPress={signOut} />
 *     </View>
 *   );
 * }
 * ```
 *
 * ERROR CHECKING:
 * If you try to use useAuth() outside of AuthProvider, it throws an error.
 * This helps catch bugs where you forget to wrap your app with AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * LEARNING NOTES:
 *
 * 1. REACT CONTEXT API
 *    Context solves "prop drilling" - passing props through many levels.
 *
 *    Steps to use Context:
 *    1. createContext() - Create the context
 *    2. Provider component - Manages state and provides value
 *    3. useContext hook - Access context in components
 *    4. Custom hook (useAuth) - Cleaner API + error checking
 *
 * 2. AUTHENTICATION FLOW
 *    Sign Up:
 *    - User fills form → signUp() → Supabase creates user
 *    - Verification email sent → User clicks link → Email verified
 *    - User can now sign in
 *
 *    Sign In:
 *    - User enters credentials → signIn() → Supabase checks password
 *    - If valid → Returns session → App shows authenticated screens
 *    - Session stored in AsyncStorage → Persists across restarts
 *
 *    Sign Out:
 *    - User clicks sign out → signOut() → Supabase clears session
 *    - App shows welcome screen
 *
 * 3. SESSION MANAGEMENT
 *    Supabase sessions include:
 *    - access_token: JWT token (expires in 1 hour by default)
 *    - refresh_token: Used to get new access_token
 *    - expires_at: When access_token expires
 *
 *    Supabase automatically refreshes tokens when needed.
 *    We configured AsyncStorage persistence in supabase.ts.
 *
 * 4. STATE MANAGEMENT
 *    We track four pieces of state:
 *    - user: Who's logged in? (null = not logged in)
 *    - session: Current session data (tokens, expiration)
 *    - loading: Is auth operation in progress? (show spinner)
 *    - initialized: Have we checked for existing session? (prevent flashing)
 *
 * 5. ERROR HANDLING
 *    All auth functions can throw errors:
 *    - Network errors (no internet)
 *    - Auth errors (wrong password, email exists)
 *    - Validation errors (weak password)
 *
 *    Components calling these functions should wrap in try/catch
 *    and display errors to users.
 *
 * 6. SECURITY BEST PRACTICES
 *    ✓ Email verification required (prevents fake accounts)
 *    ✓ Passwords never stored in plain text (Supabase hashes them)
 *    ✓ Sessions stored securely (AsyncStorage)
 *    ✓ Tokens auto-refresh (users stay logged in)
 *    ✓ HTTPS only (Supabase enforces this)
 *    ✓ Rate limiting (Supabase protects against brute force)
 *
 * 7. TYPESCRIPT BENEFITS
 *    - AuthContextType: Defines what useAuth() returns
 *    - IDE autocomplete: See available properties/functions
 *    - Type checking: Catch errors at compile time
 *    - Self-documenting: Types show how to use the API
 *
 * COMMON PATTERNS:
 *
 * Check if logged in:
 * ```tsx
 * const { user } = useAuth();
 * if (user) {
 *   // User is logged in
 * }
 * ```
 *
 * Sign in with error handling:
 * ```tsx
 * const { signIn } = useAuth();
 * try {
 *   await signIn(email, password);
 *   router.push('/home');
 * } catch (error) {
 *   setError(error.message);
 * }
 * ```
 *
 * Show loading state:
 * ```tsx
 * const { loading } = useAuth();
 * return <Button loading={loading} title="Sign In" onPress={handleSignIn} />;
 * ```
 *
 * Wait for initialization:
 * ```tsx
 * const { initialized, user } = useAuth();
 * if (!initialized) {
 *   return <LoadingScreen />;
 * }
 * return user ? <HomeScreen /> : <WelcomeScreen />;
 * ```
 */
