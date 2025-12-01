/**
 * Home Screen - Main Dashboard with AI Content
 *
 * This is the primary screen users see after signing in and completing onboarding.
 * It serves as the main hub for AI-generated learning content.
 *
 * PURPOSE:
 * - Display personalized AI-generated content
 * - Show loading state while content is being generated
 * - Allow pull-to-refresh for new content
 * - Provide a personalized welcome experience
 *
 * CONTENT GENERATION FLOW:
 * Content is ONLY generated via explicit user action:
 * - Pull-to-refresh gesture
 * - "Generate Content" button in empty state
 * - "Keep Learning" button after reading
 * - "Try Again" button after an error
 *
 * NOTE: Automatic content generation has been DISABLED to save API credits.
 * Users must explicitly request content - no auto-triggering on mount or focus.
 *
 * DESIGN SYSTEM:
 * Follows UI_RULES.md principles:
 * - Minimal: Clean layout with purposeful whitespace
 * - Light: Off-white background (#FAFAF9)
 * - Soft: Muted colors, no harsh tones
 * - Modern: Rounded corners, clean typography
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, Modal, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Sparkles, RefreshCw } from 'lucide-react-native';
import { Text, Card, CardContent, Button } from '@/components/ui';
import {
  ContentCard,
  ContentFullView,
  ContentLoadingFullScreen,
  MinimalStatsBar,
  RecentArticlesWidget,
} from '@/components/content';
import { useAppSelector, useAppDispatch, store } from '@/store';
import {
  requestContent,
  clearError,
  clearContent,
  setContentHistory,
  contentReceived,
  selectIsContentLoading,
  selectCurrentContent,
  selectContentError,
  selectHasPendingRequest,
  selectContentHistorySummaries,
} from '@/store/slices/contentSlice';
import { setContentRequested } from '@/services/userPreferencesService';
// NOTE: triggerContentGeneration is NOT imported here because it's called
// by the requestContent Redux thunk internally. Importing and calling it
// directly would cause DOUBLE webhook calls!
import {
  getFullContentHistory,
  getLatestGeneratedContent,
  getHistoryIdByRequestId,
  markContentViewed,
} from '@/services/firebase/contentHistoryService';
import {
  toggleSavedContent,
  isContentSaved,
} from '@/services/firebase/savedContentService';
import { addRecentArticle } from '@/services/firebase/recentArticlesService';
import { useGeneratedContent } from '@/hooks/useGeneratedContent';
import { fetchWeeklyStats, incrementWeeklyReadCount, updateSavedCount } from '@/store/slices/userPreferencesSlice';
import { colors } from '@/theme';

/**
 * HomeScreen Component
 *
 * The main dashboard displaying AI-generated content.
 *
 * STATE MANAGEMENT:
 * - Reads user data from auth slice (for personalization)
 * - Reads preferences from userPreferences slice (for content request)
 * - Reads content state from content slice (loading, content, errors)
 *
 * KEY BEHAVIORS:
 * - Shows loading animation when isLoading is true
 * - Shows content when available
 * - Shows error with retry when something fails
 * - Shows empty state with manual trigger when no content
 * - Supports pull-to-refresh for manual refresh
 *
 * NOTE: Auto-triggering is removed! Content is triggered at end of onboarding.
 * This prevents infinite loop issues and provides cleaner UX.
 *
 * @returns The home screen component
 */
export default function HomeScreen() {
  /**
   * Translation Hook
   *
   * useTranslation('home') loads translations from the 'home' namespace.
   */
  const { t } = useTranslation('home');

  const dispatch = useAppDispatch();

  // ============================================================================
  // STATE SELECTORS
  // ============================================================================

  /**
   * Auth State
   *
   * Get the current user for:
   * - Personalized greeting
   * - userId for content request
   * - displayName for content personalization
   */
  const { user } = useAppSelector((state) => state.auth);

  /**
   * User Preferences State
   *
   * Get user preferences for:
   * - categories: Topics to generate content about
   * - dailyLearningMinutes: How much content to generate
   * - stats: Weekly read count and saved count for MinimalStatsBar
   *
   * STATS IN REDUX:
   * Stats are now stored in Redux and loaded on app startup.
   * This ensures they persist across screen navigations and app
   * backgrounding, fixing the issue where stats would reset to 0.
   */
  const { categories, dailyLearningMinutes, stats } = useAppSelector(
    (state) => state.userPreferences
  );

  // Destructure stats for cleaner access
  // Note: weeklyReadCount is aliased to weeklyCount for consistency with component props
  const { weeklyReadCount: weeklyCount, savedCount } = stats;

  /**
   * Content State (using memoized selectors)
   *
   * Using selectors from the content slice for cleaner code.
   * Note: selectContentHistorySummaries is memoized with createSelector
   * to prevent infinite loop issues.
   */
  const isLoading = useAppSelector(selectIsContentLoading);
  const currentContent = useAppSelector(selectCurrentContent);
  const error = useAppSelector(selectContentError);
  const hasPendingRequest = useAppSelector(selectHasPendingRequest);
  const contentHistory = useAppSelector(selectContentHistorySummaries);

  // ============================================================================
  // PHASE 4: LOCAL STATE FOR CONTENT INTERACTION
  // ============================================================================

  /**
   * Full View Modal State
   *
   * Controls whether the ContentFullView modal is visible.
   * We use local state because this is UI state, not app data.
   */
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);

  /**
   * Saved State
   *
   * Tracks whether the current content is saved/bookmarked.
   * We check this when content changes and update accordingly.
   */
  const [isSaved, setIsSaved] = useState(false);

  /**
   * Recent Article View State
   *
   * When a user taps on a recent article from the RecentArticlesWidget,
   * we store that article here to display in the ContentFullView modal.
   *
   * WHY SEPARATE FROM currentContent?
   * - currentContent is for newly generated content (from Redux)
   * - recentArticleToView is for viewing previously read content
   * - They have different lifecycle and behavior:
   *   - currentContent can be dismissed and triggers new generation
   *   - recentArticleToView just closes the modal (article stays in recent list)
   */
  const [recentArticleToView, setRecentArticleToView] = useState<import('@/types/content').GeneratedContent | null>(null);

  /**
   * Recent Article Saved State
   *
   * Tracks whether the currently viewed recent article is saved/bookmarked.
   * We check Firestore when the user opens a recent article to get the
   * actual saved status (not assumed from context).
   *
   * WHY SEPARATE FROM isSaved?
   * - isSaved is for currentContent (new content from generation)
   * - recentArticleIsSaved is for articles from the recent list
   * - They have different lifecycles and sources
   */
  const [recentArticleIsSaved, setRecentArticleIsSaved] = useState(false);

  /**
   * Track previous loading state to detect content arrival
   *
   * We need to know when loading transitions from true → false
   * so we can auto-open the modal when new content arrives.
   */
  const wasLoadingRef = useRef(false);

  /**
   * Track if current content has been marked as viewed
   *
   * This prevents marking the same content as viewed multiple times.
   * Reset when content changes (new requestId).
   */
  const hasMarkedViewedRef = useRef<string | null>(null);

  /**
   * Timer reference for the 5-second viewing threshold
   *
   * We use a ref so we can clear the timer on cleanup.
   */
  const viewingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * STREAK COUNTER FIX: 5-Second Viewing Timer
   *
   * This effect marks content as "read" (viewed) after the user has been
   * viewing it for 5 seconds. This updates Firestore with:
   * - viewed: true
   * - viewedAt: serverTimestamp()
   *
   * WHY 5 SECONDS?
   * - Quick enough that users don't notice the tracking
   * - Long enough to ensure they actually looked at the content
   * - Standard pattern for "view" tracking in content apps
   *
   * WHY IS THIS IMPORTANT?
   * The streak counter (getWeeklyReadingCount) filters for entries where
   * viewed=true AND has a viewedAt timestamp. Without this effect, entries
   * would have viewed=false and never count toward the weekly streak.
   *
   * WHAT THIS FIXES:
   * Previously, the streak would reset to 0 on app refresh because:
   * 1. markContentViewed() was never called
   * 2. History entries had viewed=false
   * 3. getWeeklyReadingCount() filtered them out
   * 4. weeklyReadCount was always 0
   *
   * EDGE CASES HANDLED:
   * - User closes modal before 5 seconds → timer cancelled, not marked
   * - User navigates away → cleanup clears timer
   * - Same content viewed again → hasMarkedViewedRef prevents duplicate marks
   * - Different content → ref resets, new timer starts
   */
  useEffect(() => {
    // Clear any existing timer when dependencies change
    if (viewingTimerRef.current) {
      clearTimeout(viewingTimerRef.current);
      viewingTimerRef.current = null;
    }

    // Only start timer when:
    // 1. Full view modal is open
    // 2. We have content with a requestId
    // 3. User is authenticated
    // 4. This content hasn't been marked viewed yet
    const shouldStartTimer =
      isFullViewOpen &&
      currentContent?.requestId &&
      user?.uid &&
      hasMarkedViewedRef.current !== currentContent.requestId;

    if (!shouldStartTimer) {
      return;
    }

    console.log('[HomeScreen] Starting 5-second viewing timer for:', currentContent.requestId);

    // Start the 5-second timer
    viewingTimerRef.current = setTimeout(async () => {
      // Double-check we still have valid data
      if (!currentContent?.requestId || !user?.uid) {
        return;
      }

      // Mark that we've processed this content (prevent duplicate marks)
      hasMarkedViewedRef.current = currentContent.requestId;

      console.log('[HomeScreen] 5 seconds elapsed - marking content as viewed');

      try {
        // Step 1: Find the history entry ID using the requestId
        const historyId = await getHistoryIdByRequestId(user.uid, currentContent.requestId);

        if (historyId) {
          // Step 2: Mark it as viewed in Firestore
          await markContentViewed(user.uid, historyId);
          console.log('[HomeScreen] Content marked as viewed in Firestore');
        } else {
          console.warn('[HomeScreen] Could not find history entry for requestId:', currentContent.requestId);
        }
      } catch (error) {
        // Don't crash the app if marking fails - just log it
        console.error('[HomeScreen] Failed to mark content as viewed:', error);
      }
    }, 5000); // 5 seconds

    // Cleanup: clear timer when modal closes or component unmounts
    return () => {
      if (viewingTimerRef.current) {
        clearTimeout(viewingTimerRef.current);
        viewingTimerRef.current = null;
      }
    };
  }, [isFullViewOpen, currentContent?.requestId, user?.uid]);

  /**
   * Reset viewed tracking when content is cleared
   *
   * When content is dismissed/cleared (becomes null), we reset the
   * hasMarkedViewedRef so when new content arrives, it can be tracked.
   */
  useEffect(() => {
    // Reset the viewed tracking when content is cleared
    // This allows the next piece of content to be tracked fresh
    if (!currentContent) {
      hasMarkedViewedRef.current = null;
    }
  }, [currentContent]);

  /**
   * Check if current content is saved when content changes
   *
   * This effect runs whenever currentContent changes.
   * It checks Firestore to see if the content is already saved.
   */
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (currentContent?.requestId && user?.uid) {
        const saved = await isContentSaved(user.uid, currentContent.requestId);
        setIsSaved(saved);
      } else {
        setIsSaved(false);
      }
    };

    checkSavedStatus();
  }, [currentContent?.requestId, user?.uid]);

  /**
   * Auto-Open Modal When New Content Arrives
   *
   * This effect detects when content generation completes and automatically
   * opens the ContentFullView modal so users can immediately start reading.
   *
   * WHY AUTO-OPEN?
   * After 10-30 seconds of waiting through the loading animation, users
   * expect to see their content immediately. Opening the full view:
   * - Creates a seamless "reveal" moment
   * - Users don't need an extra tap to read
   * - Feels like the AI "delivers" the content to them
   *
   * DETECTION LOGIC:
   * We track the previous loading state in a ref. When:
   * - wasLoading = true AND isLoading = false → loading just finished
   * - currentContent exists → we have content to show
   * - no error → content arrived successfully
   * Then we auto-open the modal.
   */
  useEffect(() => {
    // Check if loading just finished (was loading, now not loading)
    const loadingJustFinished = wasLoadingRef.current && !isLoading;

    // Update ref for next render
    wasLoadingRef.current = isLoading;

    // Auto-open modal when new content arrives after loading
    if (loadingJustFinished && currentContent && !error) {
      console.log('[HomeScreen] Content arrived - auto-opening full view');
      setIsFullViewOpen(true);
    }
  }, [isLoading, currentContent, error]);

  // ============================================================================
  // PHASE 3: FIRESTORE LISTENER FOR REAL-TIME CONTENT UPDATES
  // ============================================================================

  /**
   * useGeneratedContent Hook - Real-time Firestore Listener
   *
   * This hook listens to Firestore for content updates from n8n.
   * When a request is pending (pendingRequestId exists), the hook:
   * 1. Starts listening to /users/{userId}/generatedContent/{requestId}
   * 2. When n8n writes content with status "completed", dispatches contentReceived
   * 3. When status is "error", dispatches contentError
   * 4. Times out after 60 seconds if no response
   *
   * WHY DO WE NEED THIS?
   * The webhook is fire-and-forget - we send the request and get 200 OK.
   * n8n processes asynchronously and writes to Firestore when done.
   * This listener notifies us the instant content is ready.
   *
   * The hook returns { isListening, error, retry } but we don't need to use
   * them directly since Redux state (isLoading, error) handles the UI.
   */
  useGeneratedContent(user?.uid || null);

  /**
   * Track if we've already initialized data this session
   *
   * This prevents fetching history/content multiple times if component re-renders.
   * We only need to fetch once when the user is authenticated.
   */
  const hasInitializedData = useRef(false);

  /**
   * Track if this is a "fresh" session (user just completed onboarding)
   *
   * This determines whether we auto-trigger content generation:
   * - true: User just completed onboarding → auto-trigger
   * - false: Returning user → show existing content, use FAB to generate new
   *
   * We determine this by checking if content history exists:
   * - No history = new user = should auto-trigger
   * - Has history = returning user = load existing content
   */
  const [isNewUserSession, setIsNewUserSession] = useState<boolean | null>(null);

  // ============================================================================
  // LOAD CONTENT HISTORY AND EXISTING CONTENT FROM FIRESTORE
  // ============================================================================

  /**
   * Initialize Data on Mount
   *
   * This effect loads the user's content history AND existing content from Firestore.
   * It determines if this is a new user (should auto-trigger) or returning user
   * (should show existing content).
   *
   * FLOW FOR NEW USERS:
   * 1. User completes onboarding → navigates to HomeScreen
   * 2. This effect runs → no history exists → setIsNewUserSession(true)
   * 3. Auto-trigger effect fires → generates new content
   *
   * FLOW FOR RETURNING USERS:
   * 1. User opens app → HomeScreen mounts
   * 2. This effect runs → history exists → setIsNewUserSession(false)
   * 3. Load latest content → dispatch contentReceived
   * 4. User sees their last content → can use FAB to generate new
   */
  useEffect(() => {
    const initializeData = async () => {
      // Guard: Only fetch if user is authenticated and not already initialized
      if (!user?.uid || hasInitializedData.current) {
        return;
      }

      console.log('[HomeScreen] Initializing data from Firestore...');
      hasInitializedData.current = true;

      try {
        // Fetch full history entries from Firestore
        const history = await getFullContentHistory(user.uid);

        // Update Redux state with the fetched history
        dispatch(setContentHistory(history));

        console.log(
          '[HomeScreen] Content history loaded:',
          history.length,
          'entries'
        );

        // Determine if this is a new user or returning user
        if (history.length === 0) {
          // NEW USER: No history = just completed onboarding
          // Should auto-trigger content generation
          console.log('[HomeScreen] New user detected - will auto-trigger');
          setIsNewUserSession(true);
        } else {
          // RETURNING USER: Has history = should load existing content
          console.log('[HomeScreen] Returning user detected - loading existing content');
          setIsNewUserSession(false);

          // Fetch the latest generated content
          const latestContent = await getLatestGeneratedContent(user.uid);

          if (latestContent) {
            // CRITICAL: Check the CURRENT Redux state, not the stale closure values!
            // By the time this async function completes, a content request may have
            // started. We use store.getState() to get the current values.
            //
            // WHY store.getState() INSTEAD OF isLoading/hasPendingRequest?
            // The variables isLoading and hasPendingRequest are from the render
            // when this effect started. They're stale by now. store.getState()
            // gives us the current state at this exact moment.
            const currentState = store.getState();
            const currentlyLoading = currentState.content.isLoading;
            const currentPendingRequest = currentState.content.pendingRequestId;

            if (!currentlyLoading && !currentPendingRequest) {
              // SAFE: No pending request, we can load the existing content
              dispatch(contentReceived(latestContent));
              console.log('[HomeScreen] Loaded existing content:', latestContent.requestId);
            } else {
              // GUARD: A content request is pending - don't dispatch!
              // Dispatching contentReceived clears pendingRequestId, which would kill
              // the Firestore listener that's waiting for our new content!
              console.log('[HomeScreen] Skipping existing content - request pending', {
                currentlyLoading,
                pendingRequestId: currentPendingRequest,
              });
            }
          } else {
            console.log('[HomeScreen] No existing content found');
            // No content but has history - user dismissed their content
            // They can use the FAB or empty state button to generate new
          }
        }
      } catch (err) {
        // Log error but don't block the user
        console.error('[HomeScreen] Failed to initialize data:', err);
        // Default to treating as new user so they can get content
        setIsNewUserSession(true);
      }
    };

    initializeData();
  }, [user?.uid, dispatch]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Trigger Content Generation
   *
   * Manually triggers content generation via n8n webhook.
   * Used for:
   * - Pull-to-refresh
   * - "Get Content" button in empty state
   * - "Try Again" button after error
   *
   * IMPORTANT: Resets contentWasDismissed flag because user is explicitly
   * requesting new content. This is the ONLY place where we reset this flag.
   */
  const triggerGeneration = useCallback(async () => {
    // Validate prerequisites
    if (!user?.uid) {
      console.log('[HomeScreen] Cannot trigger: No user');
      return;
    }

    if (hasPendingRequest || isLoading) {
      console.log('[HomeScreen] Cannot trigger: Already loading');
      return;
    }

    // Reset dismiss flag - user is explicitly requesting new content
    // This allows future auto-triggers to work again (e.g., after app restart)
    contentWasDismissed.current = false;

    // Clear any existing error
    dispatch(clearError());

    console.log('[HomeScreen] Triggering content generation via Redux thunk');

    // Dispatch the Redux thunk which handles the webhook call internally
    // NOTE: We previously had a BUG where we called triggerContentGeneration() directly
    // AND dispatched requestContent() - causing TWO webhook calls!
    // The thunk already calls triggerContentGeneration internally, so we only need to dispatch.
    try {
      const resultAction = await dispatch(
        requestContent({
          userId: user.uid,
          displayName: user.displayName || 'there',
          categories,
          dailyLearningMinutes: dailyLearningMinutes || 15,
          contentHistory,
        })
      );

      // Check if the thunk succeeded (unwrap throws on rejection)
      if (requestContent.fulfilled.match(resultAction)) {
        const requestId = resultAction.payload;
        // Set the contentRequested flag in Firestore
        await setContentRequested(user.uid, requestId);
        console.log('[HomeScreen] Content request sent:', requestId);
      } else {
        // Thunk was rejected - error is already in Redux state
        console.error('[HomeScreen] Content request failed');
      }
    } catch (error) {
      console.error('[HomeScreen] Content request error:', error);
    }
  }, [
    dispatch,
    user?.uid,
    user?.displayName,
    categories,
    dailyLearningMinutes,
    contentHistory,
    hasPendingRequest,
    isLoading,
  ]);

  /**
   * Handle Pull-to-Refresh
   *
   * Called when user pulls down on the ScrollView.
   * Manually triggers content generation.
   */
  const handleRefresh = useCallback(() => {
    triggerGeneration();
  }, [triggerGeneration]);

  /**
   * Handle Retry After Error
   *
   * Called when user taps "Try Again" after an error.
   */
  const handleRetry = useCallback(() => {
    triggerGeneration();
  }, [triggerGeneration]);

  // ============================================================================
  // PHASE 4: CONTENT INTERACTION HANDLERS
  // ============================================================================

  /**
   * Handle Opening Full View
   *
   * Opens the ContentFullView modal to read the full article.
   */
  const handleOpenFullView = useCallback(() => {
    setIsFullViewOpen(true);
  }, []);

  /**
   * Handle Closing Full View
   *
   * Closes the ContentFullView modal.
   *
   * UPDATED BEHAVIOR (Saved Articles Feature):
   * If the article was saved while reading, clear it from Home
   * when the modal closes. This completes the "save = move to Saved tab" flow.
   */
  const handleCloseFullView = useCallback(() => {
    setIsFullViewOpen(false);

    // If the article was saved while reading, clear it now
    if (isSaved) {
      console.log('[HomeScreen] Closing modal for saved content - clearing');
      dispatch(clearContent());
    }
  }, [isSaved, dispatch]);

  /**
   * Handle Save/Bookmark Toggle
   *
   * OPTIMISTIC UPDATE PATTERN:
   * We update the UI immediately when the user taps the bookmark icon,
   * then sync with Firestore in the background. If Firestore fails,
   * we revert the state. This provides instant feedback.
   *
   * BEHAVIOR (Saved Articles Feature):
   * When user saves content:
   * 1. Icon updates IMMEDIATELY (optimistic)
   * 2. Content is saved to Firestore (savedContent collection)
   * 3. Content DISAPPEARS from Home screen (when modal closes or immediately)
   * 4. User can find it in the Saved tab
   *
   * WHY OPTIMISTIC UPDATE?
   * - Instant feedback (no waiting for Firestore ~200-1000ms)
   * - Standard UX pattern (Twitter, Gmail, etc.)
   * - If Firestore fails, we revert to previous state
   */
  const handleSaveToggle = useCallback(async () => {
    if (!currentContent || !user?.uid) return;

    // OPTIMISTIC UPDATE: Toggle UI immediately for instant feedback
    const previousState = isSaved;
    const newSavedState = !previousState;
    setIsSaved(newSavedState);
    dispatch(updateSavedCount(newSavedState ? 1 : -1));
    console.log('[HomeScreen] Content saved state (optimistic):', newSavedState);

    try {
      // Sync with Firestore in background
      await toggleSavedContent(user.uid, currentContent);

      // If saved (not unsaved), handle content disappear logic
      if (newSavedState) {
        // Article was SAVED - move it to Saved tab

        if (isFullViewOpen) {
          // User is reading - keep modal open, but close it when they're done
          // The modal will close and content will be cleared
          // We don't close immediately so they can finish reading
          console.log('[HomeScreen] Saved while reading - will clear when modal closes');
        } else {
          // User saved from card view - disappear immediately
          console.log('[HomeScreen] Saved from card - clearing content');
          dispatch(clearContent());
        }
      }
      // If unsaved (newSavedState = false), content stays visible in Home
    } catch (err) {
      // REVERT: Firestore failed, undo the optimistic update
      console.error('[HomeScreen] Failed to toggle saved state - reverting:', err);
      setIsSaved(previousState);
      dispatch(updateSavedCount(previousState ? 1 : -1));
    }
  }, [currentContent, user?.uid, isSaved, isFullViewOpen, dispatch]);

  /**
   * Handle Dismiss/Done
   *
   * Called when user taps "Done" in the post-reading prompt.
   * Closes the modal and marks content as read.
   *
   * BEHAVIOR:
   * - Saves article to recent articles list (max 3)
   * - Increments weekly read count
   * - Clears the content (if not saved, it's deleted; if saved, it stays in Saved tab)
   * - Closes the modal
   *
   * IMPORTANT: Sets contentWasDismissed flag to prevent auto-triggering.
   * The AI workflow should only trigger on explicit user actions
   * (pull-to-refresh, "Get Content" button), not when dismissing content.
   */
  const handleDismiss = useCallback(async () => {
    // Mark content as dismissed to prevent auto-triggering
    // This ensures the workflow only triggers on explicit user actions
    contentWasDismissed.current = true;
    console.log('[HomeScreen] Content dismissed - auto-trigger blocked');

    // Save to recent articles before clearing
    // This allows users to revisit articles they've read
    if (currentContent?.content && user?.uid) {
      try {
        await addRecentArticle(user.uid, currentContent.content);
        console.log('[HomeScreen] Article added to recent list');
      } catch (err) {
        // Don't block the dismiss flow if saving to recent fails
        console.error('[HomeScreen] Failed to add to recent:', err);
      }
    }

    setIsFullViewOpen(false);

    // Update weekly count in Redux (optimistic update)
    // User just read an article, so increment the count
    dispatch(incrementWeeklyReadCount());

    // Clear content - if saved it stays in Saved tab, if not it's deleted
    dispatch(clearContent());
    console.log('[HomeScreen] Content dismissed and cleared');
  }, [dispatch, currentContent, user?.uid]);

  /**
   * Handle "Keep Learning" from Post-Reading Prompt
   *
   * Called when user taps "Keep learning" in the inline post-reading prompt.
   * This triggers new content generation while staying in the modal flow.
   *
   * FLOW:
   * 1. Save current article to recent list
   * 2. Close the current modal
   * 3. Clear current content (if not saved)
   * 4. Trigger new content generation
   * 5. Loading modal appears
   * 6. New content arrives → auto-opens in full view
   */
  const handleRequestMore = useCallback(async () => {
    console.log('[HomeScreen] User wants more content - triggering generation');

    // Save to recent articles before clearing
    // This allows users to revisit articles they've read
    if (currentContent?.content && user?.uid) {
      try {
        await addRecentArticle(user.uid, currentContent.content);
        console.log('[HomeScreen] Article added to recent list (before new content)');
      } catch (err) {
        // Don't block the flow if saving to recent fails
        console.error('[HomeScreen] Failed to add to recent:', err);
      }
    }

    // Close the current modal
    setIsFullViewOpen(false);

    // Update weekly count (user finished reading current article)
    dispatch(incrementWeeklyReadCount());

    // Clear current content
    dispatch(clearContent());

    // Trigger new content generation
    triggerGeneration();
  }, [dispatch, triggerGeneration, currentContent, user?.uid]);

  /**
   * Handle Recent Article Press
   *
   * Called when user taps an article in the RecentArticlesWidget.
   * Opens the article in the ContentFullView modal with 'saved' context
   * so user can read it again.
   *
   * IMPORTANT: We check Firestore to see if this article is actually saved.
   * Recent articles are NOT the same as saved articles - a recent article
   * may or may not be saved. We need to show the correct bookmark icon state.
   *
   * WHY 'saved' CONTEXT?
   * - Recent articles are already read - no "Done" / "Keep learning" flow needed
   * - User just wants to re-read, not trigger new content
   * - Same behavior as viewing saved articles (just close button)
   */
  const handleRecentArticlePress = useCallback(async (content: import('@/types/content').GeneratedContent) => {
    // Check if this article is actually saved in Firestore
    // This determines the correct bookmark icon state
    let isArticleSaved = false;
    if (user?.uid && content.requestId) {
      try {
        isArticleSaved = await isContentSaved(user.uid, content.requestId);
      } catch (err) {
        console.error('[HomeScreen] Failed to check saved status:', err);
        // Default to not saved if check fails
      }
    }

    setRecentArticleIsSaved(isArticleSaved);
    setRecentArticleToView(content);
    setIsFullViewOpen(true);
    console.log('[HomeScreen] Opened recent article:', content.content?.title, '| Saved:', isArticleSaved);
  }, [user?.uid]);

  /**
   * Handle Close Recent Article View
   *
   * Closes the modal when viewing a recent article.
   * Clears both the article and its saved state.
   */
  const handleCloseRecentArticle = useCallback(() => {
    setRecentArticleToView(null);
    setRecentArticleIsSaved(false);
    setIsFullViewOpen(false);
    console.log('[HomeScreen] Closed recent article view');
  }, []);

  /**
   * Handle Save/Bookmark Toggle for Recent Articles
   *
   * OPTIMISTIC UPDATE PATTERN:
   * We update the UI immediately when the user taps the bookmark icon,
   * then sync with Firestore in the background. If Firestore fails,
   * we revert the state. This provides instant feedback.
   *
   * DIFFERENCE FROM handleSaveToggle:
   * - Works with recentArticleToView instead of currentContent
   * - Updates recentArticleIsSaved instead of isSaved
   * - Does NOT clear content or close modal (recent articles stay in recent list)
   *
   * WHY SEPARATE HANDLER?
   * Recent articles and current content have different lifecycles:
   * - Current content: saving moves it to Saved tab, clears from Home
   * - Recent articles: saving just bookmarks it, article stays in recent list
   */
  const handleRecentArticleSaveToggle = useCallback(async () => {
    if (!recentArticleToView || !user?.uid) return;

    // OPTIMISTIC UPDATE: Toggle UI immediately for instant feedback
    const previousState = recentArticleIsSaved;
    const newSavedState = !previousState;
    setRecentArticleIsSaved(newSavedState);
    dispatch(updateSavedCount(newSavedState ? 1 : -1));
    console.log('[HomeScreen] Recent article saved state (optimistic):', newSavedState);

    try {
      // Sync with Firestore in background
      await toggleSavedContent(user.uid, recentArticleToView);
    } catch (err) {
      // REVERT: Firestore failed, undo the optimistic update
      console.error('[HomeScreen] Failed to toggle recent article saved state - reverting:', err);
      setRecentArticleIsSaved(previousState);
      dispatch(updateSavedCount(previousState ? 1 : -1));
    }
  }, [recentArticleToView, user?.uid, recentArticleIsSaved, dispatch]);

  // ============================================================================
  // AUTO-TRIGGER EFFECT (ONLY FOR NEW USERS)
  // ============================================================================

  /**
   * Track if we've already triggered content this session
   *
   * This ref prevents multiple triggers if the user rapidly navigates
   * in and out of the HomeScreen. It resets when the screen loses focus.
   */
  const hasTriggeredThisSession = useRef(false);

  /**
   * Track if user manually dismissed content
   *
   * This ref prevents auto-triggering after user dismisses an article.
   * When user presses "Done" to dismiss content, we set this to true.
   * This ensures the AI workflow only triggers on explicit user actions
   * (pull-to-refresh, "Get Content" button) not on dismissal.
   *
   * WHY A REF?
   * - Persists across renders without causing re-renders
   * - Not reset by the focus effect
   * - Only reset when user explicitly requests new content
   */
  const contentWasDismissed = useRef(false);

  /**
   * Auto-trigger Content Generation - DISABLED
   *
   * IMPORTANT: Automatic content generation has been DISABLED to save API credits.
   * Content is now ONLY generated when the user explicitly requests it via:
   * - Pull-to-refresh gesture
   * - "Generate Content" button in empty state
   * - "Keep Learning" button after reading
   * - "Try Again" button after an error
   *
   * WHY DISABLED?
   * Auto-triggering was consuming API credits on every app launch and after
   * onboarding. Users should be in control of when to generate new content.
   *
   * PREVIOUS BEHAVIOR (for reference):
   * - New users (just completed onboarding) would auto-trigger content
   * - This was detected by checking if content history was empty
   *
   * CURRENT BEHAVIOR:
   * - ALL users see empty state or existing content on HomeScreen
   * - Users must tap a button to generate new content
   * - This gives users control over API usage
   */
  useFocusEffect(
    useCallback(() => {
      // Log for debugging - auto-trigger is disabled
      console.log('[HomeScreen] Focus gained - auto-trigger DISABLED', {
        hasContent: !!currentContent,
        isLoading,
        hasPendingRequest,
        isNewUserSession,
      });

      // AUTO-TRIGGER DISABLED: Users must manually request content
      // Keeping this effect for logging/debugging purposes only
      // To re-enable auto-trigger, uncomment the code below and set shouldTrigger conditions

      /*
      const shouldTrigger =
        isNewUserSession === true &&
        !currentContent &&
        !isLoading &&
        !hasPendingRequest &&
        !hasTriggeredThisSession.current &&
        !contentWasDismissed.current &&
        user?.uid;

      if (shouldTrigger) {
        console.log('[HomeScreen] Auto-triggering content generation (new user)');
        hasTriggeredThisSession.current = true;
        setIsNewUserSession(false);
        triggerGeneration();
      }
      */

      console.log('[HomeScreen] User can generate content via button or pull-to-refresh');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      currentContent,
      isLoading,
      hasPendingRequest,
      user?.uid,
      isNewUserSession,
    ])
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  /**
   * Main Screen Layout
   *
   * NOTE: Loading state is now handled via a Modal (see below) instead of
   * an early return. This allows the loading animation to cover the ENTIRE
   * screen including the bottom tab bar, creating a truly immersive experience.
   *
   * REDESIGNED: Content-first layout
   * - MinimalStatsBar at top (subtle weekly streak + saved count)
   * - Main content area (ContentCard, PostReadingPrompt, or Empty state)
   * - Pull-to-refresh available
   *
   * REMOVED (per redesign):
   * - Greeting header ("Good evening, Name!")
   * - Categories/Daily Goal stats cards
   * - Help text card at bottom
   */
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false} // We use our own loading state
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View className="flex-1 px-6 py-4">
          {/* ================================================================
              MINIMAL STATS BAR - Subtle Progress Indicators

              Shows "X this week" streak and saved count at the top.
              Minimal footprint to keep focus on content.
              ================================================================ */}
          <MinimalStatsBar
            weeklyCount={weeklyCount}
            savedCount={savedCount}
            className="mb-6"
          />

          {/* ================================================================
              MAIN CONTENT AREA

              Shows one of:
              1. Error state (if something went wrong)
              2. Content (when available)
              3. Empty state (no content yet, can trigger manually)
              ================================================================ */}

          {/* Error State */}
          {error && (
            <Card className="mb-6">
              <CardContent className="items-center py-8">
                <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
                  <RefreshCw size={32} color="#EF4444" />
                </View>
                <Text variant="h3" className="mb-2 text-center">
                  {t('error.title')}
                </Text>
                <Text variant="muted" className="text-center mb-6 px-4">
                  {error}
                </Text>
                <Button onPress={handleRetry}>
                  <Text className="text-white font-medium">{t('error.tryAgain')}</Text>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Content Display - Phase 4 ContentCard */}
          {!error && currentContent && (
            <ContentCard
              content={currentContent}
              onPress={handleOpenFullView}
              onSave={handleSaveToggle}
              onDismiss={handleDismiss}
              isSaved={isSaved}
              className="mb-6"
            />
          )}

          {/* ================================================================
              EMPTY STATE - Redesigned for Better Engagement

              IMPROVEMENTS:
              1. Removed Card wrapper - content breathes across full width
              2. Larger icon (96px vs 64px) - creates visual anchor
              3. Better copy - "Ready to learn something new?" is inviting
              4. Full-width CTA - easier to tap, more prominent
              5. Centered vertically - uses space better

              WHY THESE CHANGES?
              The empty state is the first thing new users see after dismissing
              content or returning users with no content. It should feel inviting,
              not like an error state or placeholder.

              NOTE: Post-reading prompt is now INLINE in ContentFullView.
              When user finishes reading, they see "Keep learning" / "Done" buttons
              directly in the modal footer - no separate prompt component needed.
              ================================================================ */}
          {!error && !currentContent && (
            <View className="flex-1 items-center justify-center py-12">
              {/* Large icon - creates visual anchor */}
              <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-6">
                <Sparkles size={40} color={colors.primary} />
              </View>

              {/* Inviting headline */}
              <Text variant="h2" className="mb-2 text-center">
                {t('empty.title')}
              </Text>

              {/* Helpful subtitle */}
              <Text variant="muted" className="text-center px-4 mb-8">
                {t('empty.subtitle')}
              </Text>

              {/* Full-width CTA button */}
              <Button onPress={triggerGeneration} className="w-full">
                <Text className="text-white font-medium">{t('empty.button')}</Text>
              </Button>
            </View>
          )}

          {/* ================================================================
              PULL-TO-REFRESH HINT

              Subtle hint text at the bottom to remind users they can
              pull down to get new content.
              ================================================================ */}
          {currentContent && (
            <Text
              variant="small"
              className="text-center text-muted-foreground mt-4"
            >
              {t('hint.pullToRefresh')}
            </Text>
          )}

          {/* ================================================================
              RECENT ARTICLES WIDGET

              Shows the last 3 articles the user has read.
              Allows quick re-access to recently read content.

              DESIGN (from UX Expert):
              - Visually subordinate to main content card
              - Compact: title + one line preview
              - Section header: "Recent"
              - Tap article → opens full view

              ALWAYS SHOWN:
              Widget is always visible (when not loading), even when there's
              no current content. This gives returning users quick access
              to what they've read before.
              ================================================================ */}
          {!isLoading && (
            <RecentArticlesWidget
              onArticlePress={handleRecentArticlePress}
              className="pb-6"
            />
          )}
        </View>
      </ScrollView>


      {/* ================================================================
          FULL-SCREEN LOADING MODAL

          When content is loading, we display an engaging full-screen animation
          that covers the ENTIRE screen including the bottom tab bar.

          WHY USE A MODAL FOR LOADING?
          - Covers the entire screen including tab bar navigation
          - Creates a truly immersive "AI is working" experience
          - The wait is long (10-30 seconds) - users need entertainment
          - Removes all distractions and sets clear expectations
          - Creates a memorable "magic happening" moment

          MODAL SETTINGS:
          - statusBarTranslucent: Allows content to extend under status bar (Android)
          - presentationStyle="overFullScreen": Ensures full coverage on iOS
          - animationType="fade": Smooth transition in/out
          ================================================================ */}
      <Modal
        visible={isLoading}
        animationType="fade"
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
        transparent={false}
      >
        <View style={{ flex: 1, backgroundColor: '#FAFAF9' }}>
          <ContentLoadingFullScreen />
        </View>
      </Modal>

      {/* ================================================================
          CONTENT FULL VIEW MODAL - NEW CONTENT

          Modal that shows the complete content for reading.
          Uses React Native's Modal component for full-screen overlay.

          This modal is for NEW content (from generation).
          It shows "Done Reading" and "Keep Learning" buttons.
          ================================================================ */}
      {/*
        MODAL PRESENTATION STYLE - CROSS-PLATFORM FIX

        PROBLEM:
        - iOS: "pageSheet" creates a card-like modal with gap at top + rounded corners
        - Android: "pageSheet" is IGNORED - modal opens full-screen with no gap

        SOLUTION:
        - Use transparent={true} so we can control the background
        - Use statusBarTranslucent={true} for Android to extend under status bar
        - On iOS: Keep "pageSheet" for native card behavior
        - On Android: Wrap content in a View with paddingTop to create the gap

        The rounded corners in ContentFullView will now be visible because
        there's a gap/transparent area above the content.
      */}
      <Modal
        visible={isFullViewOpen && !!currentContent && !recentArticleToView}
        animationType="slide"
        transparent={Platform.OS === 'android'}
        statusBarTranslucent={Platform.OS === 'android'}
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
        onRequestClose={handleCloseFullView}
      >
        {/*
          ANDROID MODAL WRAPPER

          On Android, we need to manually create:
          1. A semi-transparent overlay (the dark area behind the modal)
          2. A gap at the top (paddingTop) so the rounded corners are visible

          On iOS, the native pageSheet handles this automatically.
        */}
        <View
          style={{
            flex: 1,
            backgroundColor: Platform.OS === 'android' ? 'rgba(0,0,0,0.4)' : 'transparent',
            paddingTop: Platform.OS === 'android' ? 40 : 0,
          }}
        >
          {currentContent && (
            <ContentFullView
              content={currentContent}
              onClose={handleCloseFullView}
              onSave={handleSaveToggle}
              onDone={handleDismiss}
              onRequestMore={handleRequestMore}
              isSaved={isSaved}
              context="home"
            />
          )}
        </View>
      </Modal>

      {/* ================================================================
          CONTENT FULL VIEW MODAL - RECENT ARTICLE

          Modal for viewing a recent article from the RecentArticlesWidget.
          Uses 'saved' context so it just shows a Close button.

          WHY SEPARATE MODAL?
          - Recent articles have different behavior (no "Keep Learning")
          - User is re-reading, not in the content generation flow
          - Simpler close behavior (no incrementing streak again)

          NOTE: We pass the actual isSaved state (checked from Firestore)
          rather than relying on context="saved" to show the bookmark.
          Recent articles may or may not be saved - they're just recently read.

          ANDROID FIX: Same cross-platform approach as main article modal.
          ================================================================ */}
      <Modal
        visible={isFullViewOpen && !!recentArticleToView}
        animationType="slide"
        transparent={Platform.OS === 'android'}
        statusBarTranslucent={Platform.OS === 'android'}
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
        onRequestClose={handleCloseRecentArticle}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: Platform.OS === 'android' ? 'rgba(0,0,0,0.4)' : 'transparent',
            paddingTop: Platform.OS === 'android' ? 40 : 0,
          }}
        >
          {recentArticleToView && (
            <ContentFullView
              content={recentArticleToView}
              onClose={handleCloseRecentArticle}
              onSave={handleRecentArticleSaveToggle}
              isSaved={recentArticleIsSaved}
              context="saved"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. NO AUTOMATIC CONTENT GENERATION
 *    Content is NEVER auto-triggered. Users must explicitly request content via:
 *    - Pull-to-refresh gesture
 *    - "Generate Content" button in empty state
 *    - "Keep Learning" button after reading
 *    - "Try Again" button after an error
 *
 *    This gives users control over API credit usage.
 *
 * 2. USER TYPE DETECTION (FOR REFERENCE)
 *    On mount, we still detect if the user has content history:
 *    - No history = NEW USER → shows empty state with button
 *    - Has history = RETURNING USER → loads existing content
 *
 *    Previously, new users would auto-trigger. Now they see empty state.
 *
 * 3. MANUAL CONTENT GENERATION
 *    Users can manually request new content via:
 *    - Pull-to-refresh gesture
 *    - "Get Content" button (in empty state)
 *    - "Try Again" button (after error)
 *
 * 4. INFINITE LOOP PREVENTION
 *    Multiple layers prevent infinite loops:
 *    a) hasTriggeredThisSession ref - blocks rapid re-triggers
 *    b) isNewUserSession guard - only auto-trigger for new users
 *    c) isLoading guard - prevents triggering while loading
 *    d) hasPendingRequest guard - prevents duplicate requests
 *    e) currentContent guard - doesn't trigger if we have content
 *    f) Memoized selectors - contentHistory doesn't change reference
 *
 * 5. MEMOIZED SELECTORS
 *    The contentHistory selector uses createSelector for memoization.
 *    Without this, .map() creates a new array reference every render,
 *    which can cause infinite re-renders.
 *
 * 6. CONTENT FLOW (NEW USER)
 *    User completes onboarding → navigates to HomeScreen →
 *    no history detected → isNewUserSession = true →
 *    useFocusEffect fires → auto-trigger → loading state shown →
 *    n8n processes → Firestore updated → listener receives content
 *
 * 7. CONTENT FLOW (RETURNING USER)
 *    User opens app → navigates to HomeScreen →
 *    history detected → isNewUserSession = false →
 *    load existing content from Firestore → display immediately →
 *    user pulls to refresh → new content generated → replaces old content
 *
 * 8. MANUAL CONTENT GENERATION (RETURNING USERS)
 *    Returning users can manually request new content via:
 *    - Pull-to-refresh gesture (pull down on screen)
 *    - "Get Content" button (in empty state)
 *    - "Try Again" button (after error)
 *
 * 9. PHASE 3: FIRESTORE REAL-TIME LISTENER (COMPLETE)
 *    useGeneratedContent hook listens to Firestore for content updates.
 *    When n8n writes to /users/{userId}/generatedContent/{requestId}:
 *    - status "completed" → dispatches contentReceived action
 *    - status "error" → dispatches contentError action
 *    - 60-second timeout if no response
 *    - Automatic cleanup on unmount
 *
 * 10. PHASE 4: CONTENT DISPLAY & INTERACTIONS (COMPLETE)
 *    - ContentCard: Beautiful preview card with title, summary, actions
 *    - ContentFullView: Full-screen reading experience in a Modal
 *    - Save/bookmark: Toggle saved state in Firestore
 *    - Dismiss: Clear content to request new content
 *    - Sources list: Display AI sources at bottom of full view
 *
 * 11. HOME SCREEN REDESIGN (CONTENT-FIRST)
 *    The Home screen was redesigned to be content-first:
 *
 *    REMOVED:
 *    - Greeting header ("Good evening, Name!")
 *    - Categories count card
 *    - Daily goal card
 *    - Help text card
 *
 *    ADDED:
 *    - MinimalStatsBar: Subtle "X this week" streak + saved count at top
 *
 *    WHY THIS REDESIGN?
 *    - App fills "dead time" moments → users want content immediately
 *    - Less clutter = faster path to reading
 *    - "X this week" is encouraging without pressure (vs daily goals)
 *
 * 12. POST-READING FLOW (INLINE IN MODAL)
 *    When user finishes reading, the footer of ContentFullView transforms
 *    to show two simple buttons:
 *    - "Keep learning" → triggers new content generation
 *    - "Done" → closes modal and returns to home
 *
 *    This keeps the user in context (article still visible above) and avoids
 *    the jarring experience of closing one modal to show another.
 *    No celebration messages or metrics - just clean choices.
 *
 * FUTURE ENHANCEMENTS:
 * - Markdown rendering for body content
 * - Reading progress tracking
 * - Daily limit awareness ("Come back tomorrow")
 */
