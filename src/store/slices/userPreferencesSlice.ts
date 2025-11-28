/**
 * User Preferences Slice - Redux State Management for Learning Preferences
 *
 * This file defines all state, actions, and async operations related to user
 * learning preferences (categories and daily time). It follows the same patterns
 * as authSlice.ts for consistency.
 *
 * WHAT THIS SLICE MANAGES:
 * - Selected learning categories (predefined and custom)
 * - Daily learning time preference
 * - Onboarding completion status
 * - Loading states for async operations
 * - Error handling
 *
 * DATA FLOW:
 * 1. User completes onboarding → dispatch(savePreferences())
 * 2. Thunk calls Firestore service to persist
 * 3. Redux state is updated
 * 4. App reads from Redux for UI rendering
 *
 * ON APP INIT:
 * 1. Auth listener fires (user logged in)
 * 2. dispatch(loadPreferences(userId))
 * 3. Preferences loaded from Firestore into Redux
 * 4. Navigation uses onboardingCompleted to route user
 *
 * WHY SEPARATE FROM AUTH SLICE?
 * - Single Responsibility: Auth handles authentication, this handles preferences
 * - Cleaner code: Easier to maintain focused slices
 * - Scalability: Easy to add more preference-related features
 * - Testability: Can test preferences independently from auth
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getUserPreferences,
  saveUserPreferences,
  updateUserPreferences,
} from '../../services/userPreferencesService';
import { SavePreferencesInput } from '../../types/preferences';

/**
 * =============================================================================
 * STATE INTERFACE
 * =============================================================================
 */

/**
 * UserPreferencesState Interface
 *
 * Defines the shape of the preferences state in Redux.
 *
 * FIELD EXPLANATIONS:
 *
 * categories:
 *   Array of selected category IDs. Can include:
 *   - Predefined: 'technology', 'science', etc.
 *   - Custom: 'custom:blockchain', 'custom:machine learning'
 *
 * dailyLearningMinutes:
 *   Number of minutes per day. null means not yet selected.
 *   Valid values: 5, 10, 15, 30, or custom (5-120).
 *
 * onboardingCompleted:
 *   Whether the user has finished the onboarding flow.
 *   Used for navigation decisions (show onboarding or home).
 *
 * loading:
 *   True when fetching preferences from Firestore.
 *   Used to show loading states in UI.
 *
 * saving:
 *   True when saving preferences to Firestore.
 *   Separate from loading because we might want different UI feedback.
 *   Example: "Continue" button shows spinner while saving.
 *
 * error:
 *   Error message from failed operations.
 *   null means no error.
 */
interface UserPreferencesState {
  categories: string[];
  dailyLearningMinutes: number | null;
  onboardingCompleted: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

/**
 * Initial State
 *
 * The starting state when the app loads.
 * All values are "empty" - preferences haven't been loaded yet.
 */
const initialState: UserPreferencesState = {
  categories: [],
  dailyLearningMinutes: null,
  onboardingCompleted: false,
  loading: false,
  saving: false,
  error: null,
};

/**
 * =============================================================================
 * ASYNC THUNKS
 * =============================================================================
 *
 * These handle async operations (Firestore reads/writes).
 * Each thunk automatically generates pending/fulfilled/rejected actions.
 */

/**
 * Load Preferences Thunk
 *
 * Fetches user preferences from Firestore and loads them into Redux.
 *
 * WHEN TO CALL:
 * - After user authentication (in _layout.tsx or auth listener)
 * - On app resume (optional, for fresh data)
 *
 * FLOW:
 * 1. dispatch(loadPreferences(userId))
 * 2. pending: loading = true
 * 3. Firestore fetch
 * 4. fulfilled: State updated with preferences
 * 5. rejected: Error set
 *
 * @param userId - The user's UID
 * @returns The user preferences from Firestore
 */
export const loadPreferences = createAsyncThunk(
  'userPreferences/load',
  async (userId: string, { rejectWithValue }) => {
    try {
      const preferences = await getUserPreferences(userId);

      // Return preferences or default values if null
      // This handles the case where user hasn't completed onboarding yet
      return {
        categories: preferences?.categories ?? [],
        dailyLearningMinutes: preferences?.dailyLearningMinutes ?? null,
        onboardingCompleted: preferences?.onboardingCompleted ?? false,
      };

    } catch (error) {
      console.error('Error loading preferences:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to load preferences'
      );
    }
  }
);

/**
 * Save Preferences Input Type
 *
 * Defines the payload for savePreferences thunk.
 * Includes userId and the preferences to save.
 */
interface SavePreferencesPayload {
  userId: string;
  preferences: SavePreferencesInput;
}

/**
 * Save Preferences Thunk
 *
 * Saves user preferences to Firestore. Used at the end of onboarding
 * and when editing preferences from profile.
 *
 * WHEN TO CALL:
 * - On "Get Started" tap in onboarding (with onboardingCompleted: true)
 * - On "Save" in edit preferences screen
 *
 * FLOW:
 * 1. dispatch(savePreferences({ userId, preferences }))
 * 2. pending: saving = true
 * 3. Firestore write
 * 4. fulfilled: State updated, saving = false
 * 5. rejected: Error set, saving = false
 *
 * @param payload - { userId, preferences }
 * @returns The saved preferences (for Redux update)
 */
export const savePreferences = createAsyncThunk(
  'userPreferences/save',
  async (payload: SavePreferencesPayload, { rejectWithValue }) => {
    try {
      const { userId, preferences } = payload;

      // Save to Firestore
      await saveUserPreferences(userId, preferences);

      // Return the preferences to update Redux state
      return {
        categories: preferences.categories,
        dailyLearningMinutes: preferences.dailyLearningMinutes,
        onboardingCompleted: preferences.onboardingCompleted ?? false,
      };

    } catch (error) {
      console.error('Error saving preferences:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to save preferences'
      );
    }
  }
);

/**
 * Update Preferences Input Type
 *
 * Allows partial updates (just categories OR just time).
 */
interface UpdatePreferencesPayload {
  userId: string;
  updates: Partial<SavePreferencesInput>;
}

/**
 * Update Preferences Thunk
 *
 * Updates specific preference fields without overwriting others.
 *
 * WHEN TO CALL:
 * - When changing only categories
 * - When changing only time
 * - Any partial preference update
 *
 * DIFFERENCE FROM savePreferences:
 * - save: Writes all fields (used for initial save)
 * - update: Writes only specified fields (used for edits)
 *
 * @param payload - { userId, updates }
 * @returns The updates that were applied
 */
export const updatePreferencesAsync = createAsyncThunk(
  'userPreferences/update',
  async (payload: UpdatePreferencesPayload, { rejectWithValue }) => {
    try {
      const { userId, updates } = payload;

      // Update in Firestore
      await updateUserPreferences(userId, updates);

      // Return the updates to apply to Redux state
      return updates;

    } catch (error) {
      console.error('Error updating preferences:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update preferences'
      );
    }
  }
);

/**
 * =============================================================================
 * SLICE DEFINITION
 * =============================================================================
 */

const userPreferencesSlice = createSlice({
  name: 'userPreferences',
  initialState,

  /**
   * Reducers (Synchronous Actions)
   *
   * These are for local state updates that don't need Firestore.
   * Useful for:
   * - UI interactions during onboarding (before final save)
   * - Clearing state on logout
   * - Optimistic updates
   */
  reducers: {
    /**
     * Set Categories
     *
     * Updates the selected categories in Redux.
     * Used during onboarding as user selects/deselects categories.
     *
     * NOTE: This only updates Redux, NOT Firestore.
     * Call savePreferences to persist to Firestore.
     *
     * USAGE:
     * dispatch(setCategories(['technology', 'science']));
     */
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.categories = action.payload;
    },

    /**
     * Add Category
     *
     * Adds a single category to the selection.
     * Used when user taps a category chip.
     *
     * USAGE:
     * dispatch(addCategory('technology'));
     * dispatch(addCategory('custom:blockchain'));
     */
    addCategory: (state, action: PayloadAction<string>) => {
      const category = action.payload;
      // Only add if not already selected (prevent duplicates)
      if (!state.categories.includes(category)) {
        state.categories.push(category);
      }
    },

    /**
     * Remove Category
     *
     * Removes a single category from the selection.
     * Used when user taps a selected category to deselect.
     *
     * USAGE:
     * dispatch(removeCategory('technology'));
     */
    removeCategory: (state, action: PayloadAction<string>) => {
      const category = action.payload;
      state.categories = state.categories.filter(c => c !== category);
    },

    /**
     * Toggle Category
     *
     * Toggles a category's selection state.
     * If selected → remove, if not selected → add.
     *
     * CONVENIENT FOR UI:
     * Just call toggleCategory on chip tap, no need to check state.
     *
     * USAGE:
     * dispatch(toggleCategory('technology'));
     */
    toggleCategory: (state, action: PayloadAction<string>) => {
      const category = action.payload;
      const index = state.categories.indexOf(category);

      if (index === -1) {
        // Not selected → add
        state.categories.push(category);
      } else {
        // Selected → remove
        state.categories.splice(index, 1);
      }
    },

    /**
     * Set Daily Time
     *
     * Updates the daily learning minutes in Redux.
     * Used during onboarding when user selects time option.
     *
     * USAGE:
     * dispatch(setDailyTime(15));
     * dispatch(setDailyTime(null)); // Reset
     */
    setDailyTime: (state, action: PayloadAction<number | null>) => {
      state.dailyLearningMinutes = action.payload;
    },

    /**
     * Clear Preferences
     *
     * Resets all preferences to initial state.
     * IMPORTANT: Call this when user logs out!
     *
     * WHY NEEDED:
     * When user logs out and another user logs in,
     * we don't want the previous user's preferences showing.
     *
     * USAGE:
     * dispatch(clearPreferences()); // In signOut handler
     */
    clearPreferences: (state) => {
      state.categories = [];
      state.dailyLearningMinutes = null;
      state.onboardingCompleted = false;
      state.loading = false;
      state.saving = false;
      state.error = null;
    },

    /**
     * Clear Error
     *
     * Resets the error state to null.
     * Call when retrying an operation or dismissing an error.
     *
     * USAGE:
     * dispatch(clearPreferencesError());
     */
    clearPreferencesError: (state) => {
      state.error = null;
    },

    /**
     * Set Onboarding Completed
     *
     * Manually sets the onboarding completed flag.
     * Normally set via savePreferences, but available for edge cases.
     *
     * USAGE:
     * dispatch(setOnboardingCompleted(true));
     */
    setOnboardingCompleted: (state, action: PayloadAction<boolean>) => {
      state.onboardingCompleted = action.payload;
    },
  },

  /**
   * Extra Reducers (Async Thunk Handlers)
   *
   * Handle the pending/fulfilled/rejected actions from thunks.
   */
  extraReducers: (builder) => {
    builder
      // =========================================================================
      // LOAD PREFERENCES
      // =========================================================================
      .addCase(loadPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.categories;
        state.dailyLearningMinutes = action.payload.dailyLearningMinutes;
        state.onboardingCompleted = action.payload.onboardingCompleted;
      })
      .addCase(loadPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to load preferences';
      })

      // =========================================================================
      // SAVE PREFERENCES
      // =========================================================================
      .addCase(savePreferences.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(savePreferences.fulfilled, (state, action) => {
        state.saving = false;
        state.categories = action.payload.categories;
        state.dailyLearningMinutes = action.payload.dailyLearningMinutes;
        state.onboardingCompleted = action.payload.onboardingCompleted;
      })
      .addCase(savePreferences.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) ?? 'Failed to save preferences';
      })

      // =========================================================================
      // UPDATE PREFERENCES
      // =========================================================================
      .addCase(updatePreferencesAsync.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updatePreferencesAsync.fulfilled, (state, action) => {
        state.saving = false;

        // Apply only the fields that were updated
        const updates = action.payload;

        if (updates.categories !== undefined) {
          state.categories = updates.categories;
        }

        if (updates.dailyLearningMinutes !== undefined) {
          state.dailyLearningMinutes = updates.dailyLearningMinutes;
        }

        if (updates.onboardingCompleted !== undefined) {
          state.onboardingCompleted = updates.onboardingCompleted;
        }
      })
      .addCase(updatePreferencesAsync.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) ?? 'Failed to update preferences';
      });
  },
});

/**
 * Export Actions
 *
 * These are the synchronous actions from the reducers object.
 * Import and dispatch these in components.
 *
 * USAGE IN COMPONENTS:
 * import { toggleCategory, setDailyTime } from '@/store/slices/userPreferencesSlice';
 *
 * dispatch(toggleCategory('technology'));
 * dispatch(setDailyTime(15));
 */
export const {
  setCategories,
  addCategory,
  removeCategory,
  toggleCategory,
  setDailyTime,
  clearPreferences,
  clearPreferencesError,
  setOnboardingCompleted,
} = userPreferencesSlice.actions;

/**
 * Export Reducer
 *
 * The reducer function handles all actions for this slice.
 * This is imported by store/index.ts to add to the store.
 */
export default userPreferencesSlice.reducer;

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. TWO LOADING STATES: loading vs saving
 *
 *    We have separate loading states because:
 *    - loading: Fetching data (user waits to see content)
 *    - saving: Writing data (user waits for confirmation)
 *
 *    Different UI feedback:
 *    - loading: Full screen skeleton or spinner
 *    - saving: Button spinner, disable inputs
 *
 * 2. SYNCHRONOUS VS ASYNC ACTIONS
 *
 *    Synchronous (reducers):
 *    - Immediate state updates
 *    - No Firestore involved
 *    - For UI interactions during onboarding
 *
 *    Async (thunks):
 *    - Firestore operations
 *    - Auto-generates pending/fulfilled/rejected
 *    - For persisting data
 *
 *    Example flow in onboarding:
 *    1. User taps category → dispatch(toggleCategory('tech')) [sync]
 *    2. User taps category → dispatch(toggleCategory('science')) [sync]
 *    3. User taps "Continue" → navigate to next screen
 *    4. User selects time → dispatch(setDailyTime(15)) [sync]
 *    5. User taps "Get Started" → dispatch(savePreferences(...)) [async]
 *
 * 3. CLEARING STATE ON LOGOUT
 *
 *    IMPORTANT: Always dispatch clearPreferences() when user logs out!
 *
 *    Without this:
 *    - User A logs in, selects "Technology"
 *    - User A logs out
 *    - User B logs in
 *    - User B sees "Technology" selected (from User A's state!)
 *
 *    The signOut thunk in authSlice should dispatch clearPreferences.
 *
 * 4. OPTIMISTIC UPDATES (FUTURE ENHANCEMENT)
 *
 *    Current approach: Wait for Firestore, then update Redux
 *    Optimistic: Update Redux immediately, revert if Firestore fails
 *
 *    For preferences, the current approach is fine because:
 *    - Save happens infrequently (end of onboarding, rare edits)
 *    - Small delay is acceptable
 *    - Simpler error handling
 *
 * 5. SELECTORS (COULD ADD LATER)
 *
 *    You could add selector functions like:
 *
 *    export const selectCategories = (state: RootState) =>
 *      state.userPreferences.categories;
 *
 *    export const selectHasCompletedOnboarding = (state: RootState) =>
 *      state.userPreferences.onboardingCompleted;
 *
 *    Benefits:
 *    - Reusable logic
 *    - Memoization with reselect
 *    - Single source of truth for derived data
 *
 * 6. USAGE PATTERNS
 *
 *    Loading preferences on auth:
 *    useEffect(() => {
 *      if (user) {
 *        dispatch(loadPreferences(user.uid));
 *      }
 *    }, [user]);
 *
 *    Saving on onboarding complete:
 *    const handleGetStarted = async () => {
 *      const result = await dispatch(savePreferences({
 *        userId: user.uid,
 *        preferences: {
 *          categories,
 *          dailyLearningMinutes,
 *          onboardingCompleted: true,
 *        },
 *      }));
 *
 *      if (savePreferences.fulfilled.match(result)) {
 *        router.replace('/home');
 *      }
 *    };
 *
 *    Checking onboarding status for navigation:
 *    const { onboardingCompleted } = useAppSelector(state => state.userPreferences);
 *
 *    if (user && !onboardingCompleted) {
 *      router.replace('/onboarding/category-selection');
 *    }
 */
