/**
 * Content Slice - Redux State for AI Content Generation
 *
 * This slice manages all state related to the content generation system:
 * - Pending request tracking
 * - Loading states
 * - Current content being displayed
 * - Content history for anti-repetition
 * - Error handling
 *
 * WHAT IS A SLICE?
 * In Redux Toolkit, a "slice" is a collection of reducer logic and actions
 * for a single feature of your app. Think of it as a "mini-store" for
 * a specific domain (in this case, content generation).
 *
 * STATE FLOW:
 * 1. User triggers content request (requestContent thunk)
 * 2. State: isLoading = true, pendingRequestId = "uuid"
 * 3. Firestore listener receives content (contentReceived action)
 * 4. State: isLoading = false, currentContent = {...}
 *
 * OR on error:
 * 3. Listener receives error or timeout (contentError action)
 * 4. State: isLoading = false, error = "message"
 *
 * WHY REDUX FOR CONTENT?
 * - Global access: Any component can access content state
 * - Predictable updates: Actions flow through reducers
 * - DevTools: Debug content flow with time-travel
 * - Persistence: Easy to save/restore state
 */

import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import {
  ContentState,
  GeneratedContent,
  ContentHistoryEntry,
} from '@/types/content';
import { triggerContentGeneration } from '@/services/n8n/contentService';

/**
 * =============================================================================
 * INITIAL STATE
 * =============================================================================
 *
 * The starting state when the app loads.
 * All values are "empty" or "not loading".
 */
const initialState: ContentState = {
  /**
   * pendingRequestId
   *
   * The UUID of a request that's waiting for a response.
   * null when no request is pending.
   *
   * USAGE:
   * - Set when content is requested
   * - Used by Firestore listener to know which document to watch
   * - Cleared when content received or error occurs
   */
  pendingRequestId: null,

  /**
   * isLoading
   *
   * True when waiting for content generation to complete.
   *
   * USAGE:
   * - Shows loading animation in UI
   * - Prevents duplicate requests
   * - True from request until response/error
   */
  isLoading: false,

  /**
   * currentContent
   *
   * The content currently being displayed to the user.
   * null when no content is available.
   *
   * USAGE:
   * - Rendered in ContentCard component
   * - Cleared when user dismisses content
   */
  currentContent: null,

  /**
   * contentQueue
   *
   * Multiple pieces of content waiting to be shown.
   * (For future use - batch content generation)
   *
   * USAGE:
   * - When user requests more, next item from queue is shown
   * - New content added to end of queue
   */
  contentQueue: [],

  /**
   * contentHistory
   *
   * Recent content summaries for anti-repetition.
   * Loaded from Firestore, included in webhook payload.
   *
   * USAGE:
   * - Sent to n8n so AI knows what to avoid
   * - Last 20 entries typically
   */
  contentHistory: [],

  /**
   * error
   *
   * Error message if something went wrong.
   * null when no error.
   *
   * USAGE:
   * - Displayed to user in UI
   * - Cleared when new request starts
   */
  error: null,

  /**
   * lastFetchedAt
   *
   * Timestamp of when content was last successfully received.
   * Used to determine if content is "stale" (> 24 hours old).
   *
   * USAGE:
   * - Triggers auto-refresh if too old
   * - Shows "last updated" in UI (optional)
   */
  lastFetchedAt: null,
};

/**
 * =============================================================================
 * ASYNC THUNKS
 * =============================================================================
 *
 * Thunks are async actions that can contain side effects.
 * They're the standard way to handle async operations in Redux Toolkit.
 */

/**
 * Request Content Thunk
 *
 * Async action that triggers content generation by calling the n8n webhook.
 * This is the main entry point for requesting new content.
 *
 * WHAT IT DOES:
 * 1. Validates inputs
 * 2. Calls n8n webhook via contentService
 * 3. Returns requestId for tracking
 * 4. Redux handles pending/fulfilled/rejected states
 *
 * USAGE:
 * ```typescript
 * dispatch(requestContent({
 *   userId: 'user123',
 *   displayName: 'John',
 *   categories: ['technology'],
 *   dailyLearningMinutes: 15,
 *   contentHistory: ['Previous topic 1']
 * }));
 * ```
 *
 * STATE CHANGES:
 * - pending: isLoading = true, error = null
 * - fulfilled: pendingRequestId = uuid (isLoading stays true!)
 * - rejected: isLoading = false, error = message
 *
 * NOTE: isLoading stays true after fulfilled because we're still
 * waiting for content from Firestore. It only becomes false when
 * contentReceived or contentError is dispatched.
 */
export const requestContent = createAsyncThunk<
  // Return type (on success)
  string, // requestId
  // Argument type
  {
    userId: string;
    displayName: string;
    categories: string[];
    dailyLearningMinutes: number;
    contentHistory: string[];
  },
  // Thunk API config
  {
    rejectValue: string; // Error message type
  }
>(
  // Action type prefix
  'content/requestContent',

  // Thunk function
  async (params, { rejectWithValue }) => {
    /**
     * Call the n8n webhook service
     *
     * This sends the POST request and returns immediately.
     * The actual content arrives via Firestore (handled elsewhere).
     */
    const result = await triggerContentGeneration(
      params.userId,
      params.displayName,
      params.categories,
      params.dailyLearningMinutes,
      params.contentHistory
    );

    /**
     * Handle Errors
     *
     * If the webhook call failed, reject the thunk.
     * This triggers the .rejected case in extraReducers.
     */
    if (!result.success) {
      return rejectWithValue(result.error || 'Failed to request content');
    }

    /**
     * Return Request ID
     *
     * On success, return the requestId.
     * This is stored in pendingRequestId and used by the Firestore listener.
     */
    return result.requestId;
  }
);

/**
 * =============================================================================
 * SLICE DEFINITION
 * =============================================================================
 *
 * The createSlice function generates:
 * - Reducer function for this slice
 * - Action creators for each reducer
 * - Action types (auto-generated)
 */
const contentSlice = createSlice({
  // Slice name - used as prefix for action types
  name: 'content',

  // Initial state
  initialState,

  /**
   * Reducers
   *
   * Synchronous state updates. Each reducer becomes an action creator.
   * Redux Toolkit uses Immer, so you can "mutate" state directly
   * (it's actually creating a new immutable state).
   */
  reducers: {
    /**
     * Content Received
     *
     * Called when Firestore listener receives completed content.
     * This is dispatched from the useContentListener hook.
     *
     * USAGE:
     * dispatch(contentReceived(generatedContent));
     *
     * STATE CHANGES:
     * - currentContent = payload
     * - isLoading = false
     * - pendingRequestId = null
     * - error = null
     * - lastFetchedAt = now
     */
    contentReceived: (state, action: PayloadAction<GeneratedContent>) => {
      state.currentContent = action.payload;
      state.isLoading = false;
      state.pendingRequestId = null;
      state.error = null;
      /**
       * Store timestamp as ISO string instead of Date object.
       * Redux requires all state values to be serializable (JSON-compatible).
       * Date objects are NOT serializable, so we use ISO strings.
       *
       * To convert back to Date when needed: new Date(state.lastFetchedAt)
       */
      state.lastFetchedAt = new Date().toISOString();
    },

    /**
     * Content Error
     *
     * Called when content generation fails (timeout, n8n error, etc.).
     * This is dispatched from the useContentListener hook.
     *
     * USAGE:
     * dispatch(contentError('Request timed out'));
     *
     * STATE CHANGES:
     * - error = payload
     * - isLoading = false
     * - pendingRequestId = null
     */
    contentError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
      state.pendingRequestId = null;
    },

    /**
     * Clear Content
     *
     * Clears the current content from display.
     * Used when user dismisses content or navigates away.
     *
     * USAGE:
     * dispatch(clearContent());
     *
     * STATE CHANGES:
     * - currentContent = null
     * - error = null
     */
    clearContent: (state) => {
      state.currentContent = null;
      state.error = null;
    },

    /**
     * Clear Error
     *
     * Clears just the error message.
     * Used before retrying a failed request.
     *
     * USAGE:
     * dispatch(clearError());
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Set Content History
     *
     * Updates the content history array.
     * Called after fetching history from Firestore.
     *
     * USAGE:
     * dispatch(setContentHistory(historyEntries));
     *
     * STATE CHANGES:
     * - contentHistory = payload
     */
    setContentHistory: (state, action: PayloadAction<ContentHistoryEntry[]>) => {
      state.contentHistory = action.payload;
    },

    /**
     * Add to Content History
     *
     * Adds a single entry to content history.
     * Called after content is received and viewed.
     *
     * USAGE:
     * dispatch(addToContentHistory(newEntry));
     *
     * STATE CHANGES:
     * - Prepends entry to contentHistory
     * - Keeps only last 20 entries
     */
    addToContentHistory: (state, action: PayloadAction<ContentHistoryEntry>) => {
      // Add to beginning of array (most recent first)
      state.contentHistory.unshift(action.payload);

      // Keep only last 20 entries
      if (state.contentHistory.length > 20) {
        state.contentHistory = state.contentHistory.slice(0, 20);
      }
    },

    /**
     * Add to Content Queue
     *
     * Adds content to the queue for later viewing.
     * Used when multiple pieces of content are generated.
     *
     * USAGE:
     * dispatch(addToContentQueue(content));
     */
    addToContentQueue: (state, action: PayloadAction<GeneratedContent>) => {
      state.contentQueue.push(action.payload);
    },

    /**
     * Show Next Content
     *
     * Moves the next item from queue to currentContent.
     * Used when user wants to see more content.
     *
     * USAGE:
     * dispatch(showNextContent());
     */
    showNextContent: (state) => {
      if (state.contentQueue.length > 0) {
        state.currentContent = state.contentQueue.shift() || null;
      }
    },

    /**
     * Reset Content State
     *
     * Resets everything to initial state.
     * Used on sign out or for testing.
     *
     * USAGE:
     * dispatch(resetContentState());
     */
    resetContentState: () => initialState,
  },

  /**
   * Extra Reducers
   *
   * Handle actions from async thunks.
   * These are automatically generated action types from createAsyncThunk.
   */
  extraReducers: (builder) => {
    builder
      /**
       * Request Content - Pending
       *
       * Triggered when requestContent thunk starts.
       * Sets loading state and clears any previous error.
       */
      .addCase(requestContent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      /**
       * Request Content - Fulfilled
       *
       * Triggered when webhook call succeeds.
       * Stores the requestId but keeps isLoading true
       * (waiting for Firestore response).
       */
      .addCase(requestContent.fulfilled, (state, action) => {
        state.pendingRequestId = action.payload;
        // Note: isLoading stays TRUE because we're still
        // waiting for content via Firestore listener
      })

      /**
       * Request Content - Rejected
       *
       * Triggered when webhook call fails.
       * Stops loading and shows error.
       */
      .addCase(requestContent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to request content';
        state.pendingRequestId = null;
      });
  },
});

/**
 * =============================================================================
 * EXPORTS
 * =============================================================================
 */

/**
 * Export Actions
 *
 * These are the action creators generated by createSlice.
 * Import and dispatch them from components:
 *
 * import { contentReceived, clearContent } from '@/store/slices/contentSlice';
 * dispatch(contentReceived(content));
 */
export const {
  contentReceived,
  contentError,
  clearContent,
  clearError,
  setContentHistory,
  addToContentHistory,
  addToContentQueue,
  showNextContent,
  resetContentState,
} = contentSlice.actions;

/**
 * Export Reducer
 *
 * The reducer function is used in the store configuration.
 * It's the default export of the slice.
 */
export default contentSlice.reducer;

/**
 * =============================================================================
 * SELECTORS (Optional but useful)
 * =============================================================================
 *
 * Selectors are functions that extract specific pieces of state.
 * They can be used with useAppSelector for cleaner component code.
 *
 * Note: These are defined here for convenience but could also be
 * in a separate selectors file for larger apps.
 */

import type { RootState } from '@/store';

/**
 * Select Content Loading State
 * Returns true if content is being generated.
 */
export const selectIsContentLoading = (state: RootState) => state.content.isLoading;

/**
 * Select Current Content
 * Returns the content being displayed, or null.
 */
export const selectCurrentContent = (state: RootState) => state.content.currentContent;

/**
 * Select Content Error
 * Returns error message, or null if no error.
 */
export const selectContentError = (state: RootState) => state.content.error;

/**
 * Select Has Pending Request
 * Returns true if there's a request waiting for response.
 */
export const selectHasPendingRequest = (state: RootState) =>
  state.content.pendingRequestId !== null;

/**
 * Select Pending Request ID
 * Returns the ID of the pending request, or null.
 */
export const selectPendingRequestId = (state: RootState) => state.content.pendingRequestId;

/**
 * Select Content History Summaries
 * Returns array of topic summaries for the webhook payload.
 *
 * IMPORTANT: Uses createSelector for memoization!
 * Without memoization, .map() creates a new array reference every render,
 * causing infinite loops in useEffect dependencies.
 */
export const selectContentHistorySummaries = createSelector(
  [(state: RootState) => state.content.contentHistory],
  (contentHistory) => contentHistory.map((entry) => entry.topicSummary)
);

/**
 * Select Has Unread Content
 * Returns true if there's content the user hasn't viewed yet.
 */
export const selectHasUnreadContent = (state: RootState) =>
  state.content.currentContent !== null || state.content.contentQueue.length > 0;

/**
 * Select Last Fetched At
 * Returns when content was last received.
 */
export const selectLastFetchedAt = (state: RootState) => state.content.lastFetchedAt;

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. createAsyncThunk
 *    This is Redux Toolkit's way to handle async operations.
 *    It automatically generates three action types:
 *    - pending: When the async function starts
 *    - fulfilled: When it succeeds (with return value)
 *    - rejected: When it fails (with rejectWithValue)
 *
 * 2. PayloadAction<T>
 *    TypeScript type for actions with a typed payload.
 *    PayloadAction<string> means action.payload is a string.
 *
 * 3. Immer Under the Hood
 *    Redux Toolkit uses Immer, so you can write "mutating" code:
 *    state.isLoading = true;
 *
 *    This actually creates a new immutable state object.
 *    Without Immer, you'd have to write:
 *    return { ...state, isLoading: true };
 *
 * 4. Builder Pattern for extraReducers
 *    The builder.addCase pattern is type-safe and allows:
 *    - Handling specific action types
 *    - Proper TypeScript inference
 *    - Clean, readable code
 *
 * 5. Selectors
 *    Selectors centralize state access:
 *    - Single source of truth for "how to get X"
 *    - Easy to memoize with createSelector (for computed values)
 *    - Changes to state shape only need updates here
 *
 * 6. Initial State Type
 *    TypeScript infers the state type from initialState.
 *    This ensures all reducers maintain the correct shape.
 *
 * 7. Why pendingRequestId stays after fulfilled?
 *    The webhook call succeeding doesn't mean we have content.
 *    Content arrives via Firestore, so we track the requestId
 *    to know which document to listen for.
 *
 * TESTING TIP:
 * You can test reducers in isolation:
 * const newState = contentSlice.reducer(initialState, contentReceived(mockContent));
 * expect(newState.currentContent).toEqual(mockContent);
 */
