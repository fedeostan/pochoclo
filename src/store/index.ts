/**
 * Redux Store Configuration (Firebase Version)
 *
 * This file sets up the Redux store for our application using Redux Toolkit.
 * Think of the store as a centralized "database" that holds all the app's
 * state in one place, accessible from any component.
 *
 * WHAT IS REDUX?
 * Redux is a state management library that follows three principles:
 * 1. Single source of truth - All state lives in one store
 * 2. State is read-only - Can only change state by dispatching actions
 * 3. Changes are made with pure functions - Reducers are predictable
 *
 * WHY REDUX TOOLKIT?
 * Redux Toolkit simplifies Redux by:
 * - Eliminating boilerplate code (no more switch statements!)
 * - Including useful utilities (createSlice, createAsyncThunk)
 * - Setting up good defaults (Redux DevTools, middleware)
 * - Making immutable updates easy (uses Immer under the hood)
 *
 * MIGRATION FROM SUPABASE TO FIREBASE:
 * The main change here is in the serializable check configuration:
 * - Removed Supabase action types (auth/initializeAuth/fulfilled)
 * - Removed auth.session from ignored paths (Firebase has no session object!)
 * - Firebase User objects are still non-serializable, so we still ignore auth.user
 *
 * COMPARISON: CONTEXT API VS REDUX
 *
 * Context API:
 * - Built into React (no extra packages)
 * - Good for simple state (theme, auth)
 * - Can cause unnecessary re-renders
 * - No built-in devtools
 *
 * Redux:
 * - Predictable state updates via actions
 * - Great devtools (time-travel debugging!)
 * - Better for complex state with many updates
 * - Built-in async handling (thunks)
 * - More scalable for large apps
 */

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';

/**
 * Configure the Redux Store
 *
 * configureStore is Redux Toolkit's way of creating a store.
 * It automatically:
 * - Combines your reducers
 * - Adds redux-thunk middleware (for async actions)
 * - Enables Redux DevTools (in development)
 * - Sets up development checks for common mistakes
 *
 * WHAT IS A REDUCER?
 * A reducer is a function that takes the current state and an action,
 * and returns a new state. Think of it as a recipe for how state should
 * change in response to different actions.
 */
export const store = configureStore({
  /**
   * Reducer Configuration
   *
   * Each key in this object becomes a "slice" of state.
   * For example, with { auth: authReducer }:
   * - state.auth contains all auth-related state
   * - authReducer handles all auth-related actions
   *
   * As your app grows, you'll add more slices:
   * {
   *   auth: authReducer,
   *   user: userReducer,      // User profile data
   *   movies: moviesReducer,  // Movie data
   *   settings: settingsReducer, // App settings
   * }
   */
  reducer: {
    auth: authReducer,
  },

  /**
   * Middleware Configuration
   *
   * Middleware sits between dispatching an action and the reducer.
   * It can intercept actions, perform side effects, or modify actions.
   *
   * Redux Toolkit includes these middleware by default:
   * - redux-thunk: Allows async actions (like API calls)
   * - serializableCheck: Warns about non-serializable values
   * - immutableCheck: Warns about accidental mutations
   *
   * FIREBASE VS SUPABASE - SERIALIZABLE CHECK CHANGES:
   *
   * Firebase User objects contain non-serializable values (dates, methods, etc.)
   * just like Supabase, so we still need to ignore auth.user.
   *
   * However, Firebase has NO session object, so we:
   * - REMOVED: 'auth/initializeAuth/fulfilled' (no longer exists)
   * - REMOVED: 'auth.session' from ignoredPaths (Firebase has no session!)
   *
   * This makes our config simpler than before!
   *
   * WHY IGNORE SERIALIZABLE CHECK FOR THESE?
   * Redux's serializable check ensures state can be:
   * - Persisted to storage
   * - Time-travel debugged
   * - Safely cloned
   *
   * But Firebase User objects contain:
   * - Date objects (metadata.creationTime, lastSignInTime)
   * - Methods (getIdToken, reload, etc.)
   *
   * These don't serialize to JSON cleanly, so we tell Redux "trust us, this is fine."
   * In a production app, you might normalize this data first.
   */
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        /**
         * Ignored Actions
         *
         * These action types carry Firebase User objects in their payload.
         * We tell Redux not to check if these payloads are serializable.
         *
         * FIREBASE VERSION:
         * - auth/signIn/fulfilled: User object from sign in
         * - auth/signUp/fulfilled: User object from sign up
         * - auth/setAuthState: User object from onAuthStateChanged listener
         *
         * REMOVED FROM SUPABASE VERSION:
         * - auth/initializeAuth/fulfilled: No longer exists in Firebase version
         */
        ignoredActions: [
          'auth/signIn/fulfilled',
          'auth/signUp/fulfilled',
          'auth/setAuthState',
        ],

        /**
         * Ignored Paths
         *
         * These paths in state contain non-serializable values.
         * Redux won't warn about them during state updates.
         *
         * FIREBASE VERSION:
         * - auth.user: Firebase User object with dates and methods
         *
         * REMOVED FROM SUPABASE VERSION:
         * - auth.session: Firebase has no session object!
         *
         * This is simpler because Firebase manages tokens internally
         * and doesn't expose them to us.
         */
        ignoredPaths: ['auth.user'],
      },
    }),
});

/**
 * TypeScript Type Exports
 *
 * These types help TypeScript understand our store's shape.
 * They provide autocomplete and type checking when using Redux hooks.
 *
 * RootState: The type of the entire state tree
 * AppDispatch: The type of the dispatch function (includes thunks)
 */

/**
 * RootState Type
 *
 * This type represents the entire state tree.
 * TypeScript infers it from the store itself.
 *
 * Example of what it looks like (FIREBASE VERSION):
 * {
 *   auth: {
 *     user: User | null | undefined;  // Firebase User, no Session!
 *     loading: boolean;
 *     initialized: boolean;
 *     error: string | null;
 *   }
 * }
 *
 * COMPARED TO SUPABASE VERSION:
 * {
 *   auth: {
 *     user: User | null | undefined;
 *     session: Session | null;  // <-- This is GONE in Firebase!
 *     loading: boolean;
 *     initialized: boolean;
 *     error: string | null;
 *   }
 * }
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * AppDispatch Type
 *
 * The dispatch type that includes async thunks.
 * Regular Redux dispatch only handles plain objects.
 * AppDispatch also handles thunks (async functions).
 *
 * Example:
 * dispatch(signIn({ email, password }))  // This is a thunk
 * dispatch({ type: 'auth/clearError' })  // This is a plain action
 *
 * Both work with AppDispatch!
 */
export type AppDispatch = typeof store.dispatch;

/**
 * Typed Hooks
 *
 * These are custom hooks that replace the standard useDispatch and useSelector.
 * They include our app's specific types for better TypeScript support.
 *
 * WHY CREATE TYPED HOOKS?
 *
 * Without typed hooks:
 * const dispatch = useDispatch();  // dispatch is typed as Dispatch<AnyAction>
 * const user = useSelector(state => state.auth.user);  // 'state' is 'unknown'
 *
 * With typed hooks:
 * const dispatch = useAppDispatch();  // dispatch knows about our thunks
 * const user = useAppSelector(state => state.auth.user);  // 'state' is RootState
 *
 * TypeScript will:
 * - Autocomplete state properties (state.auth.user)
 * - Catch typos (state.auth.usr → error!)
 * - Know the return type of selectors
 */

/**
 * useAppDispatch Hook
 *
 * Use this instead of useDispatch() from react-redux.
 * It knows about our async thunks, so TypeScript won't complain.
 *
 * USAGE:
 * const dispatch = useAppDispatch();
 * dispatch(signIn({ email, password }));  // TypeScript knows this is valid
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * useAppSelector Hook
 *
 * Use this instead of useSelector() from react-redux.
 * It knows the shape of our state, so you get autocomplete.
 *
 * USAGE:
 * const user = useAppSelector((state) => state.auth.user);
 * // TypeScript knows 'state' is RootState
 * // And knows 'user' is User | null | undefined (Firebase User type!)
 *
 * You can also destructure:
 * const { user, loading } = useAppSelector((state) => state.auth);
 *
 * NOTE: No more session! Firebase doesn't have sessions in state.
 * If you need tokens, use Firebase's getIdToken() method on the User object.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * LEARNING NOTES:
 *
 * 1. STORE SETUP
 *    configureStore does a lot under the hood:
 *    - Combines reducers with combineReducers
 *    - Adds thunk middleware for async actions
 *    - Sets up Redux DevTools extension
 *    - Enables development-mode checks
 *
 * 2. SLICES OF STATE
 *    The reducer object defines "slices" of state:
 *    { auth: authReducer } creates state.auth
 *    Each slice is independent and managed by its own reducer.
 *
 * 3. MIDDLEWARE CHAIN
 *    Actions flow through middleware before reaching reducers:
 *    dispatch(action) → middleware1 → middleware2 → reducer → new state
 *
 *    Thunk middleware intercepts functions:
 *    dispatch(asyncThunk) → thunk middleware executes function → dispatches real actions
 *
 * 4. TYPE SAFETY
 *    TypeScript types ensure:
 *    - useAppSelector knows the state shape
 *    - useAppDispatch knows about async thunks
 *    - Components get proper type checking
 *    - Autocomplete works in your IDE
 *
 * 5. DEVTOOLS
 *    Redux DevTools (browser extension) lets you:
 *    - See all state in one place
 *    - Watch actions as they're dispatched
 *    - Time-travel (go back to previous states)
 *    - Debug by replaying actions
 *
 *    Install the browser extension for Chrome/Firefox to use this!
 *
 * 6. SERIALIZABLE CHECK - FIREBASE SPECIFICS
 *    Redux expects all state to be serializable (can be JSON.stringify'd).
 *
 *    Firebase changes:
 *    - Still ignore auth.user (Firebase User has dates/methods)
 *    - REMOVED auth.session (Firebase has no session object!)
 *    - REMOVED auth/initializeAuth action (Firebase uses listener pattern)
 *
 *    This is actually simpler than the Supabase version!
 *
 * 7. NO SESSION - WHAT ABOUT TOKENS?
 *    If you need the user's authentication token (e.g., for API calls):
 *
 *    Firebase way:
 *    const token = await user.getIdToken();
 *
 *    The token is fetched on-demand, not stored in state.
 *    Firebase handles token refresh automatically.
 *
 * COMMON PATTERNS:
 *
 * Selecting state:
 * const user = useAppSelector((state) => state.auth.user);
 *
 * Dispatching actions:
 * const dispatch = useAppDispatch();
 * dispatch(someAction());
 *
 * Dispatching async thunks:
 * dispatch(signIn({ email, password }));
 *
 * Selecting multiple values:
 * const { user, loading, error } = useAppSelector((state) => state.auth);
 *
 * NEXT STEPS:
 * See authSlice.ts for how we define state and actions with Firebase.
 * See _layout.tsx for how we set up the Firebase auth listener.
 */
