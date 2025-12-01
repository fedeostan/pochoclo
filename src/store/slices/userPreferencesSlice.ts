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
  updateNotificationPreferences,
} from '../../services/userPreferencesService';
import { getWeeklyReadingCount } from '../../services/firebase/contentHistoryService';
import { getSavedContentCount } from '../../services/firebase/savedContentService';
import {
  SavePreferencesInput,
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../../types/preferences';

/**
 * =============================================================================
 * STATE INTERFACE
 * =============================================================================
 */

/**
 * Weekly Stats State Interface
 *
 * Represents the user's reading statistics in Redux.
 * Used to display streak/count in MinimalStatsBar on HomeScreen.
 *
 * WHY STORE IN REDUX?
 * - Persists across component re-renders and navigation
 * - Available immediately when app loads (no loading flash)
 * - Can be updated optimistically when user reads content
 * - Single source of truth for all components that need stats
 *
 * WHY NOT FIRESTORE?
 * - These are computed values derived from contentHistory
 * - Storing would create data duplication
 * - Computed on-demand from source of truth (contentHistory)
 */
interface WeeklyStatsState {
  /**
   * Number of articles the user READ this week (Sunday-Saturday).
   * Calculated from contentHistory entries with viewed: true
   * and viewedAt within the current week.
   */
  weeklyReadCount: number;

  /**
   * Total number of saved/bookmarked articles.
   * Fetched from savedContent collection count.
   */
  savedCount: number;

  /**
   * Whether stats are currently being fetched.
   * Used to show loading state in UI.
   */
  statsLoading: boolean;
}

/**
 * Notification State Interface
 *
 * Represents the notification-related state in Redux.
 * Separated for clarity, but embedded in UserPreferencesState.
 *
 * WHY INCLUDE permissionStatus IN REDUX?
 * - The UI needs to know current permission status
 * - Determines what we show in notification settings:
 *   - 'undetermined': Can ask for permission
 *   - 'granted': Can enable/disable and change time
 *   - 'denied': Show message about going to settings
 * - Persisted in Redux, not Firestore (device-specific)
 */
interface NotificationState {
  /**
   * Whether notifications are enabled (user's preference)
   *
   * This is the user's PREFERENCE - they want notifications.
   * Actual notification scheduling also depends on permissionStatus.
   */
  enabled: boolean;

  /**
   * Time for daily notification in "HH:MM" format
   *
   * null means no time selected yet (uses default "09:00").
   */
  time: string | null;

  /**
   * System permission status for notifications
   *
   * IMPORTANT: This is the OS-level permission, not user preference.
   * - 'undetermined': Haven't asked yet
   * - 'granted': OS allows notifications
   * - 'denied': OS blocks notifications (must change in Settings)
   *
   * WHY NOT IN FIRESTORE?
   * Permission is device-specific. If user has app on multiple devices,
   * each device has its own permission status.
   */
  permissionStatus: 'undetermined' | 'granted' | 'denied';
}

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
 * notifications:
 *   User's notification preferences and current permission status.
 *   See NotificationState interface for details.
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
  notifications: NotificationState;
  /**
   * Weekly reading statistics for MinimalStatsBar.
   * Loaded on app startup and updated when user reads content.
   */
  stats: WeeklyStatsState;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

/**
 * Initial State
 *
 * The starting state when the app loads.
 * All values are "empty" - preferences haven't been loaded yet.
 *
 * NOTIFICATION INITIAL STATE:
 * - enabled: false (from DEFAULT_NOTIFICATION_PREFERENCES)
 * - time: '09:00' (from DEFAULT_NOTIFICATION_PREFERENCES)
 * - permissionStatus: 'undetermined' (we'll check on app load)
 *
 * STATS INITIAL STATE:
 * - weeklyReadCount: 0 (will be fetched from Firestore)
 * - savedCount: 0 (will be fetched from Firestore)
 * - statsLoading: false (not loading yet)
 */
const initialState: UserPreferencesState = {
  categories: [],
  dailyLearningMinutes: null,
  onboardingCompleted: false,
  notifications: {
    // Use defaults from preferences types
    enabled: DEFAULT_NOTIFICATION_PREFERENCES.enabled,
    time: DEFAULT_NOTIFICATION_PREFERENCES.time,
    // Permission status starts as undetermined - we check on app load
    permissionStatus: 'undetermined',
  },
  stats: {
    // Stats start at 0 - will be fetched on app load
    weeklyReadCount: 0,
    savedCount: 0,
    statsLoading: false,
  },
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
      //
      // NOTIFICATION LOADING:
      // - If preferences.notifications exists, use those values
      // - If not (older users), use defaults
      // - permissionStatus is NOT loaded from Firestore (it's device-specific)
      return {
        categories: preferences?.categories ?? [],
        dailyLearningMinutes: preferences?.dailyLearningMinutes ?? null,
        onboardingCompleted: preferences?.onboardingCompleted ?? false,
        // Notifications: merge with defaults to handle missing fields
        notifications: {
          enabled: preferences?.notifications?.enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.enabled,
          time: preferences?.notifications?.time ?? DEFAULT_NOTIFICATION_PREFERENCES.time,
        },
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
 * Save Notification Preferences Input Type
 *
 * Payload for saving notification preferences to Firestore.
 */
interface SaveNotificationPreferencesPayload {
  userId: string;
  notifications: NotificationPreferences;
}

/**
 * Save Notification Preferences Thunk
 *
 * Saves notification preferences to Firestore independently of other preferences.
 * Used when user changes notification settings.
 *
 * WHEN TO CALL:
 * - User toggles notifications on/off
 * - User changes notification time
 * - After successful permission request
 *
 * WHY SEPARATE FROM savePreferences?
 * - Notification settings change independently
 * - Smaller, focused updates
 * - Don't need to touch categories or learning time
 *
 * FLOW:
 * 1. dispatch(saveNotificationPreferencesAsync({ userId, notifications }))
 * 2. pending: saving = true
 * 3. Firestore update (only notifications field)
 * 4. fulfilled: Redux notification state updated
 * 5. rejected: Error set
 *
 * @param payload - { userId, notifications }
 * @returns The saved notifications (for Redux update)
 */
export const saveNotificationPreferencesAsync = createAsyncThunk(
  'userPreferences/saveNotifications',
  async (payload: SaveNotificationPreferencesPayload, { rejectWithValue }) => {
    try {
      const { userId, notifications } = payload;

      // Save to Firestore using the dedicated notification update function
      await updateNotificationPreferences(userId, notifications);

      // Return the notifications to update Redux state
      return notifications;

    } catch (error) {
      console.error('Error saving notification preferences:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to save notification preferences'
      );
    }
  }
);

/**
 * Fetch Weekly Stats Thunk
 *
 * Fetches the user's weekly reading count and saved content count from Firestore.
 * Called on app startup (in _layout.tsx) to populate the stats immediately.
 *
 * WHEN TO CALL:
 * - On app startup after user is authenticated
 * - After user reads/dismisses content (to refresh count)
 * - On pull-to-refresh in HomeScreen
 *
 * WHY A SEPARATE THUNK?
 * - Stats are independent from preferences
 * - Loaded separately from loadPreferences (called at different times)
 * - Keeps concerns separated for better maintainability
 *
 * FLOW:
 * 1. dispatch(fetchWeeklyStats(userId))
 * 2. pending: statsLoading = true
 * 3. Parallel fetch: getWeeklyReadingCount + getSavedContentCount
 * 4. fulfilled: stats updated, statsLoading = false
 * 5. rejected: error handled gracefully (stats remain 0)
 *
 * @param userId - The user's UID
 * @returns Object with weeklyReadCount and savedCount
 */
export const fetchWeeklyStats = createAsyncThunk(
  'userPreferences/fetchWeeklyStats',
  async (userId: string, { rejectWithValue }) => {
    try {
      console.log('[UserPreferences] Fetching weekly stats for user:', userId);

      // Fetch both counts in parallel for efficiency
      const [weeklyReadCount, savedCount] = await Promise.all([
        getWeeklyReadingCount(userId),
        getSavedContentCount(userId),
      ]);

      console.log('[UserPreferences] Stats fetched - weekly:', weeklyReadCount, 'saved:', savedCount);

      return {
        weeklyReadCount,
        savedCount,
      };

    } catch (error) {
      console.error('[UserPreferences] Error fetching weekly stats:', error);
      // Return 0s on error instead of rejecting - stats are non-critical
      // This prevents the UI from showing error states for minor issues
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch weekly stats'
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
     * CLEARS:
     * - Categories
     * - Daily learning minutes
     * - Onboarding status
     * - Notification preferences (enabled, time)
     * - Loading/saving/error states
     *
     * NOTE: Permission status is reset to 'undetermined'
     * The next user may have different OS permissions.
     *
     * USAGE:
     * dispatch(clearPreferences()); // In signOut handler
     */
    clearPreferences: (state) => {
      state.categories = [];
      state.dailyLearningMinutes = null;
      state.onboardingCompleted = false;
      // Reset notifications to defaults
      state.notifications = {
        enabled: DEFAULT_NOTIFICATION_PREFERENCES.enabled,
        time: DEFAULT_NOTIFICATION_PREFERENCES.time,
        permissionStatus: 'undetermined',
      };
      // Reset stats to defaults
      state.stats = {
        weeklyReadCount: 0,
        savedCount: 0,
        statsLoading: false,
      };
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

    // =========================================================================
    // NOTIFICATION ACTIONS
    // =========================================================================

    /**
     * Set Notification Enabled
     *
     * Updates whether notifications are enabled in Redux state.
     * This is a LOCAL state update - use saveNotificationPreferencesAsync
     * to persist to Firestore.
     *
     * WHEN TO USE:
     * - Optimistic update when user toggles notification switch
     * - After confirming permission was granted
     *
     * IMPORTANT: This only updates Redux, NOT Firestore!
     * Always follow up with saveNotificationPreferencesAsync for persistence.
     *
     * USAGE:
     * dispatch(setNotificationEnabled(true));
     * // Then save to Firestore:
     * dispatch(saveNotificationPreferencesAsync({
     *   userId,
     *   notifications: { enabled: true, time: currentTime }
     * }));
     */
    setNotificationEnabled: (state, action: PayloadAction<boolean>) => {
      state.notifications.enabled = action.payload;
    },

    /**
     * Set Notification Time
     *
     * Updates the notification time in Redux state.
     * Time should be in "HH:MM" format (24-hour).
     *
     * WHEN TO USE:
     * - User changes time in notification settings
     * - Optimistic update before Firestore save
     *
     * IMPORTANT: This only updates Redux, NOT Firestore!
     * Always follow up with saveNotificationPreferencesAsync for persistence.
     *
     * USAGE:
     * dispatch(setNotificationTime('14:30')); // Set to 2:30 PM
     */
    setNotificationTime: (state, action: PayloadAction<string | null>) => {
      state.notifications.time = action.payload;
    },

    /**
     * Set Notification Permission Status
     *
     * Updates the system permission status in Redux.
     * Called after checking or requesting permission.
     *
     * WHY THIS IS A SYNCHRONOUS ACTION:
     * - Permission status is device-specific (not in Firestore)
     * - Checked on app load or when user visits notification settings
     * - No need for async thunk since it's just local state
     *
     * WHEN TO USE:
     * - After calling getNotificationPermissionStatus()
     * - After calling requestNotificationPermission()
     * - On app startup to sync with current OS permission
     *
     * USAGE:
     * import { getNotificationPermissionStatus } from '@/services/notificationService';
     *
     * const status = await getNotificationPermissionStatus();
     * dispatch(setNotificationPermissionStatus(status));
     */
    setNotificationPermissionStatus: (
      state,
      action: PayloadAction<'undetermined' | 'granted' | 'denied'>
    ) => {
      state.notifications.permissionStatus = action.payload;
    },

    // =========================================================================
    // STATS ACTIONS
    // =========================================================================

    /**
     * Increment Weekly Read Count
     *
     * Optimistically increments the weekly read count by 1.
     * Called immediately when user marks content as read/dismissed.
     *
     * WHY OPTIMISTIC UPDATE?
     * - Provides instant feedback in the UI
     * - User sees their progress increase immediately
     * - The actual Firestore write happens in the background
     *
     * USAGE:
     * // When user dismisses content after reading:
     * await markContentViewed(userId, historyId);
     * dispatch(incrementWeeklyReadCount());
     */
    incrementWeeklyReadCount: (state) => {
      state.stats.weeklyReadCount += 1;
    },

    /**
     * Update Saved Count
     *
     * Updates the saved content count.
     * Called when user saves or unsaves content.
     *
     * @param delta - Number to add (1 for save, -1 for unsave)
     *
     * USAGE:
     * // When user saves content:
     * dispatch(updateSavedCount(1));
     * // When user unsaves content:
     * dispatch(updateSavedCount(-1));
     */
    updateSavedCount: (state, action: PayloadAction<number>) => {
      state.stats.savedCount = Math.max(0, state.stats.savedCount + action.payload);
    },

    /**
     * Set Stats
     *
     * Directly sets both stat values.
     * Used when refreshing stats from Firestore.
     *
     * USAGE:
     * dispatch(setStats({ weeklyReadCount: 5, savedCount: 10 }));
     */
    setStats: (state, action: PayloadAction<{ weeklyReadCount: number; savedCount: number }>) => {
      state.stats.weeklyReadCount = action.payload.weeklyReadCount;
      state.stats.savedCount = action.payload.savedCount;
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
        // Update notification preferences from Firestore
        // Note: permissionStatus is NOT updated here (it's device-specific)
        // The UI should call getNotificationPermissionStatus separately
        state.notifications.enabled = action.payload.notifications.enabled;
        state.notifications.time = action.payload.notifications.time;
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
      })

      // =========================================================================
      // SAVE NOTIFICATION PREFERENCES
      // =========================================================================
      /**
       * Handles the saveNotificationPreferencesAsync thunk states.
       *
       * WHY SEPARATE HANDLERS FOR NOTIFICATIONS?
       * - Notification updates are independent of other preferences
       * - Only updates notification-related state fields
       * - Cleaner, more focused state management
       */
      .addCase(saveNotificationPreferencesAsync.pending, (state) => {
        // Use 'saving' flag to indicate async operation in progress
        // UI can show loading state on save button
        state.saving = true;
        state.error = null;
      })
      .addCase(saveNotificationPreferencesAsync.fulfilled, (state, action) => {
        state.saving = false;
        // Update notification state with saved values
        // The action.payload contains the NotificationPreferences that were saved
        state.notifications.enabled = action.payload.enabled;
        state.notifications.time = action.payload.time;
        // Note: permissionStatus is NOT updated here - it's device-specific
        // and not stored in Firestore
      })
      .addCase(saveNotificationPreferencesAsync.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) ?? 'Failed to save notification preferences';
        // Note: We don't revert the notification state on failure
        // because the synchronous actions may have already updated it.
        // The UI should handle this by showing an error message
        // and potentially re-syncing state from Firestore.
      })

      // =========================================================================
      // FETCH WEEKLY STATS
      // =========================================================================
      /**
       * Handles the fetchWeeklyStats thunk states.
       *
       * Stats are fetched on app startup and when user actions might change counts.
       * We use a separate loading state (statsLoading) to not interfere with
       * other loading states like preferences loading.
       */
      .addCase(fetchWeeklyStats.pending, (state) => {
        state.stats.statsLoading = true;
        // Don't clear error - stats errors are non-critical
      })
      .addCase(fetchWeeklyStats.fulfilled, (state, action) => {
        state.stats.statsLoading = false;
        state.stats.weeklyReadCount = action.payload.weeklyReadCount;
        state.stats.savedCount = action.payload.savedCount;
      })
      .addCase(fetchWeeklyStats.rejected, (state) => {
        state.stats.statsLoading = false;
        // Don't set error - stats errors are non-critical
        // Stats will remain at their previous values (or 0 if never loaded)
        // This is fine because stats are nice-to-have, not essential
        console.warn('[UserPreferences] Stats fetch failed - using cached values');
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
 * import {
 *   toggleCategory,
 *   setDailyTime,
 *   setNotificationEnabled,
 *   setNotificationTime,
 *   setNotificationPermissionStatus,
 * } from '@/store/slices/userPreferencesSlice';
 *
 * // Category/time actions
 * dispatch(toggleCategory('technology'));
 * dispatch(setDailyTime(15));
 *
 * // Notification actions
 * dispatch(setNotificationEnabled(true));
 * dispatch(setNotificationTime('14:30'));
 * dispatch(setNotificationPermissionStatus('granted'));
 */
export const {
  // Category actions
  setCategories,
  addCategory,
  removeCategory,
  toggleCategory,
  // Time action
  setDailyTime,
  // General actions
  clearPreferences,
  clearPreferencesError,
  setOnboardingCompleted,
  // Notification actions
  setNotificationEnabled,
  setNotificationTime,
  setNotificationPermissionStatus,
  // Stats actions
  incrementWeeklyReadCount,
  updateSavedCount,
  setStats,
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
 *
 * 7. NOTIFICATION STATE MANAGEMENT
 *
 *    The notification state has three parts:
 *    - enabled: User's preference (stored in Firestore)
 *    - time: User's preferred time (stored in Firestore)
 *    - permissionStatus: OS permission (NOT in Firestore, device-specific)
 *
 *    WHY PERMISSION STATUS IS LOCAL ONLY:
 *    If User A has the app on iPhone and iPad:
 *    - iPhone might have notifications enabled
 *    - iPad might have notifications disabled
 *    - Each device has its own permission state
 *    - So we DON'T store permission in Firestore
 *
 *    NOTIFICATION FLOW:
 *    1. User opens notification settings
 *    2. Check current permission: getNotificationPermissionStatus()
 *    3. Update Redux: dispatch(setNotificationPermissionStatus(status))
 *    4. If user enables and permission needed:
 *       - Call requestNotificationPermission()
 *       - Update permission status
 *    5. If permission granted:
 *       - Schedule notification: scheduleDailyNotification(time)
 *       - Save preference: dispatch(saveNotificationPreferencesAsync(...))
 *    6. If user changes time:
 *       - Reschedule notification
 *       - Save preference
 *
 *    EXAMPLE USAGE:
 *    import {
 *      getNotificationPermissionStatus,
 *      requestNotificationPermission,
 *      scheduleDailyNotification,
 *      cancelDailyNotification,
 *    } from '@/services/notificationService';
 *
 *    // On notification toggle
 *    const handleToggle = async (enabled: boolean) => {
 *      if (enabled) {
 *        const granted = await requestNotificationPermission();
 *        if (granted) {
 *          await scheduleDailyNotification(time);
 *          dispatch(saveNotificationPreferencesAsync({
 *            userId,
 *            notifications: { enabled: true, time }
 *          }));
 *        }
 *      } else {
 *        await cancelDailyNotification();
 *        dispatch(saveNotificationPreferencesAsync({
 *          userId,
 *          notifications: { enabled: false, time }
 *        }));
 *      }
 *    };
 */
