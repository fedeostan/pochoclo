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
 * Content is auto-triggered when user lands on HomeScreen if:
 * - No content is currently loading
 * - No content is currently displayed
 * - No pending request exists
 *
 * This happens via useFocusEffect which fires when the screen gains focus.
 * The screen also supports manual refresh via pull-to-refresh.
 *
 * DESIGN SYSTEM:
 * Follows UI_RULES.md principles:
 * - Minimal: Clean layout with purposeful whitespace
 * - Light: Off-white background (#FAFAF9)
 * - Soft: Muted colors, no harsh tones
 * - Modern: Rounded corners, clean typography
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Sparkles, RefreshCw } from 'lucide-react-native';
import { Text, Card, CardContent, Button } from '@/components/ui';
import { ContentLoadingState } from '@/components/ContentLoadingState';
import { ContentCard, ContentFullView } from '@/components/content';
import { useAppSelector, useAppDispatch } from '@/store';
import {
  requestContent,
  clearError,
  clearContent,
  setContentHistory,
  selectIsContentLoading,
  selectCurrentContent,
  selectContentError,
  selectHasPendingRequest,
  selectContentHistorySummaries,
} from '@/store/slices/contentSlice';
import { setContentRequested } from '@/services/userPreferencesService';
import { triggerContentGeneration } from '@/services/n8n/contentService';
import { getFullContentHistory } from '@/services/firebase/contentHistoryService';
import { toggleSavedContent, isContentSaved } from '@/services/firebase/savedContentService';
import { useGeneratedContent } from '@/hooks/useGeneratedContent';
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
   */
  const { categories, dailyLearningMinutes } = useAppSelector(
    (state) => state.userPreferences
  );

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
   * Track if we've already fetched history this session
   *
   * This prevents fetching history multiple times if component re-renders.
   * We only need to fetch once when the user is authenticated.
   */
  const hasLoadedHistory = useRef(false);

  // ============================================================================
  // LOAD CONTENT HISTORY FROM FIRESTORE
  // ============================================================================

  /**
   * Fetch Content History on Mount
   *
   * This effect loads the user's content history from Firestore when:
   * - User is authenticated (user.uid exists)
   * - History hasn't been loaded yet this session
   *
   * WHY DO WE NEED THIS?
   * The contentHistory in Redux starts empty. We need to populate it
   * from Firestore so that:
   * 1. The webhook payload includes previous topic summaries
   * 2. The AI knows what topics to avoid (anti-repetition)
   *
   * FLOW:
   * 1. User signs in → HomeScreen mounts
   * 2. This effect runs → fetches last 20 history entries from Firestore
   * 3. Dispatches setContentHistory → Redux state updated
   * 4. When content is requested → contentHistory (summaries) included in payload
   *
   * WHY useEffect INSTEAD OF useFocusEffect?
   * - We only need to load history once per session, not every time screen focuses
   * - useFocusEffect would re-fetch every time user navigates back to Home
   * - useEffect with ref guard ensures single fetch on mount
   */
  useEffect(() => {
    const loadContentHistory = async () => {
      // Guard: Only fetch if user is authenticated and history not loaded
      if (!user?.uid || hasLoadedHistory.current) {
        return;
      }

      console.log('[HomeScreen] Loading content history from Firestore...');
      hasLoadedHistory.current = true;

      try {
        // Fetch full history entries from Firestore
        // This returns ContentHistoryEntry[] with all fields
        const history = await getFullContentHistory(user.uid);

        // Update Redux state with the fetched history
        // The slice's setContentHistory action stores the full entries
        // The selectContentHistorySummaries selector extracts just the summaries
        dispatch(setContentHistory(history));

        console.log(
          '[HomeScreen] Content history loaded:',
          history.length,
          'entries'
        );
      } catch (err) {
        // Log error but don't show to user - history fetch failure isn't critical
        // Content generation can proceed without history (just won't have anti-repetition)
        console.error('[HomeScreen] Failed to load content history:', err);
      }
    };

    loadContentHistory();
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

    // Clear any existing error
    dispatch(clearError());

    console.log('[HomeScreen] Manually triggering content generation');

    // Trigger n8n webhook
    const result = await triggerContentGeneration(
      user.uid,
      user.displayName || 'there',
      categories,
      dailyLearningMinutes || 15,
      contentHistory
    );

    if (result.success) {
      // Set the contentRequested flag in Firestore
      await setContentRequested(user.uid, result.requestId);

      // Update Redux state
      dispatch(
        requestContent({
          userId: user.uid,
          displayName: user.displayName || 'there',
          categories,
          dailyLearningMinutes: dailyLearningMinutes || 15,
          contentHistory,
        })
      );

      console.log('[HomeScreen] Content request sent:', result.requestId);
    } else {
      console.error('[HomeScreen] Content request failed:', result.error);
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
   */
  const handleCloseFullView = useCallback(() => {
    setIsFullViewOpen(false);
  }, []);

  /**
   * Handle Save/Bookmark Toggle
   *
   * Toggles the saved state of the current content.
   * Updates both Firestore and local state.
   */
  const handleSaveToggle = useCallback(async () => {
    if (!currentContent || !user?.uid) return;

    try {
      const newSavedState = await toggleSavedContent(user.uid, currentContent);
      setIsSaved(newSavedState);
      console.log('[HomeScreen] Content saved state:', newSavedState);
    } catch (err) {
      console.error('[HomeScreen] Failed to toggle saved state:', err);
    }
  }, [currentContent, user?.uid]);

  /**
   * Handle Dismiss/Done
   *
   * Marks the content as read and clears it from view.
   * This allows the user to request new content.
   */
  const handleDismiss = useCallback(() => {
    dispatch(clearContent());
    setIsFullViewOpen(false);
    console.log('[HomeScreen] Content dismissed');
  }, [dispatch]);

  // ============================================================================
  // AUTO-TRIGGER EFFECT
  // ============================================================================

  /**
   * Track if we've already triggered content this session
   *
   * This ref prevents multiple triggers if the user rapidly navigates
   * in and out of the HomeScreen. It resets when the screen loses focus.
   */
  const hasTriggeredThisSession = useRef(false);

  /**
   * Auto-trigger Content Generation on Screen Focus
   *
   * This effect runs when the HomeScreen gains focus (user navigates to it).
   * It will automatically trigger content generation if:
   * - User has no current content
   * - No request is already pending
   * - Not already loading
   * - Haven't triggered this session already
   *
   * WHY useFocusEffect INSTEAD OF useEffect?
   * - useFocusEffect only fires when the screen is focused
   * - Prevents triggers when screen is in background
   * - Properly cleans up when screen loses focus
   *
   * INFINITE LOOP PREVENTION:
   * 1. hasTriggeredThisSession ref prevents rapid re-triggers
   * 2. Guards check isLoading, hasPendingRequest, currentContent
   * 3. Dependencies are kept minimal (just what's needed for guards)
   */
  useFocusEffect(
    useCallback(() => {
      // Log for debugging
      console.log('[HomeScreen] Focus gained, checking if should trigger...', {
        hasContent: !!currentContent,
        isLoading,
        hasPendingRequest,
        hasTriggered: hasTriggeredThisSession.current,
      });

      // Check all guards before triggering
      const shouldTrigger =
        !currentContent &&        // No content to display
        !isLoading &&             // Not already loading
        !hasPendingRequest &&     // No request pending
        !hasTriggeredThisSession.current && // Haven't triggered yet
        user?.uid;                // User must be authenticated

      if (shouldTrigger) {
        console.log('[HomeScreen] Auto-triggering content generation');
        hasTriggeredThisSession.current = true;
        triggerGeneration();
      } else {
        console.log('[HomeScreen] Skipping auto-trigger');
      }

      // Cleanup: Reset the flag when screen loses focus
      // This allows re-triggering next time user comes back
      return () => {
        console.log('[HomeScreen] Focus lost, resetting trigger flag');
        hasTriggeredThisSession.current = false;
      };
    }, [
      currentContent,
      isLoading,
      hasPendingRequest,
      user?.uid,
      triggerGeneration,
    ])
  );

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Get Greeting Based on Time of Day
   */
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  /**
   * Get User's First Name
   */
  const getFirstName = (): string => {
    if (user?.displayName) {
      return user.displayName.split(' ')[0];
    }
    return 'there';
  };

  // ============================================================================
  // RENDER
  // ============================================================================

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
        <View className="flex-1 px-6 py-8">
          {/* ================================================================
              HEADER SECTION - Personalized Welcome
              ================================================================ */}
          <View className="mb-8">
            <Text variant="h1" className="mb-2">
              {getGreeting()}, {getFirstName()}!
            </Text>
            <Text variant="lead" className="text-muted-foreground">
              {isLoading
                ? "Let's get you some great content..."
                : currentContent
                  ? "Here's something interesting for you"
                  : 'Ready to learn something new?'}
            </Text>
          </View>

          {/* ================================================================
              MAIN CONTENT AREA

              Shows one of:
              1. Loading state (while generating content)
              2. Error state (if something went wrong)
              3. Content (when available)
              4. Empty state (no content yet, can trigger manually)
              ================================================================ */}

          {/* Loading State */}
          {isLoading && <ContentLoadingState isLoading={true} />}

          {/* Error State */}
          {!isLoading && error && (
            <Card className="mb-6">
              <CardContent className="items-center py-8">
                <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
                  <RefreshCw size={32} color="#EF4444" />
                </View>
                <Text variant="h3" className="mb-2 text-center">
                  Something went wrong
                </Text>
                <Text variant="muted" className="text-center mb-6 px-4">
                  {error}
                </Text>
                <Button onPress={handleRetry}>
                  <Text className="text-white font-medium">Try Again</Text>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Content Display - Phase 4 ContentCard */}
          {!isLoading && !error && currentContent && (
            <ContentCard
              content={currentContent}
              onPress={handleOpenFullView}
              onSave={handleSaveToggle}
              onDismiss={handleDismiss}
              isSaved={isSaved}
              className="mb-6"
            />
          )}

          {/* Empty State - Ready to Generate */}
          {!isLoading && !error && !currentContent && (
            <Card className="mb-6">
              <CardContent className="items-center py-12">
                <View className="w-16 h-16 rounded-full bg-primary-100 items-center justify-center mb-4">
                  <Sparkles size={32} color={colors.primary} />
                </View>
                <Text variant="h3" className="mb-2 text-center">
                  Your Learning Hub
                </Text>
                <Text variant="muted" className="text-center px-4 mb-6">
                  Pull down to refresh or tap below to get personalized content.
                </Text>
                <Button onPress={triggerGeneration}>
                  <Text className="text-white font-medium">Get Content</Text>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ================================================================
              INFO SECTION - Quick Stats
              ================================================================ */}
          {!isLoading && (
            <View className="flex-row gap-4 mb-6">
              <QuickStatCard
                title="Categories"
                subtitle="Topics you're learning"
                value={`${categories.length}`}
              />
              <QuickStatCard
                title="Daily Goal"
                subtitle="Minutes per day"
                value={`${dailyLearningMinutes || 0}`}
              />
            </View>
          )}

          {/* ================================================================
              HELP TEXT
              ================================================================ */}
          {!isLoading && (
            <Card variant="outline">
              <CardContent>
                <Text variant="small" className="text-muted-foreground">
                  {error
                    ? 'Having trouble? Check your internet connection and try again.'
                    : 'Pull down to refresh for new content. Our AI generates personalized learning material just for you.'}
                </Text>
              </CardContent>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* ================================================================
          PHASE 4: FULL VIEW MODAL

          Modal that shows the complete content for reading.
          Uses React Native's Modal component for full-screen overlay.
          ================================================================ */}
      <Modal
        visible={isFullViewOpen && !!currentContent}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseFullView}
      >
        {currentContent && (
          <ContentFullView
            content={currentContent}
            onClose={handleCloseFullView}
            onSave={handleSaveToggle}
            onDone={handleDismiss}
            isSaved={isSaved}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

// ==============================================================================
// QUICK STAT CARD COMPONENT
// ==============================================================================

interface QuickStatCardProps {
  title: string;
  subtitle: string;
  value: string;
}

function QuickStatCard({ title, subtitle, value }: QuickStatCardProps) {
  return (
    <Card className="flex-1">
      <CardContent className="py-4">
        <View className="self-start px-2 py-1 rounded-md bg-primary-100 mb-2">
          <Text variant="small" className="text-primary font-medium">
            {value}
          </Text>
        </View>
        <Text className="font-medium mb-1">{title}</Text>
        <Text variant="small" className="text-muted-foreground">
          {subtitle}
        </Text>
      </CardContent>
    </Card>
  );
}

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. AUTO-TRIGGER WITH useFocusEffect
 *    Content is auto-triggered when user lands on HomeScreen using useFocusEffect.
 *    This is safer than useEffect because:
 *    - Only fires when screen gains focus (not on background re-renders)
 *    - Properly cleans up when screen loses focus
 *    - Combined with guards and refs, prevents infinite loops
 *
 * 2. INFINITE LOOP PREVENTION
 *    Multiple layers prevent infinite loops:
 *    a) hasTriggeredThisSession ref - blocks rapid re-triggers
 *    b) isLoading guard - prevents triggering while loading
 *    c) hasPendingRequest guard - prevents duplicate requests
 *    d) currentContent guard - doesn't trigger if we have content
 *    e) Memoized selectors - contentHistory doesn't change reference
 *
 * 3. MEMOIZED SELECTORS
 *    The contentHistory selector uses createSelector for memoization.
 *    Without this, .map() creates a new array reference every render,
 *    which can cause infinite re-renders.
 *
 * 4. CONTENT TRIGGER FLOW
 *    User completes onboarding → navigates to HomeScreen →
 *    useFocusEffect fires → no content exists → auto-trigger →
 *    loading state shown → n8n processes → Firestore updated →
 *    listener receives content → display to user
 *
 * 5. MANUAL REFRESH ALSO SUPPORTED
 *    Users can manually request new content via:
 *    - Pull-to-refresh gesture
 *    - "Get Content" button (in empty state)
 *    - "Try Again" button (after error)
 *
 * 6. PHASE 3: FIRESTORE REAL-TIME LISTENER (COMPLETE)
 *    useGeneratedContent hook listens to Firestore for content updates.
 *    When n8n writes to /users/{userId}/generatedContent/{requestId}:
 *    - status "completed" → dispatches contentReceived action
 *    - status "error" → dispatches contentError action
 *    - 60-second timeout if no response
 *    - Automatic cleanup on unmount
 *
 * 7. PHASE 4: CONTENT DISPLAY & INTERACTIONS (COMPLETE)
 *    - ContentCard: Beautiful preview card with title, summary, actions
 *    - ContentFullView: Full-screen reading experience in a Modal
 *    - Save/bookmark: Toggle saved state in Firestore
 *    - Dismiss: Clear content to request new content
 *    - Sources list: Display AI sources at bottom of full view
 *
 * FUTURE ENHANCEMENTS:
 * - Markdown rendering for body content
 * - Reading progress tracking
 * - Daily limit awareness ("Come back tomorrow")
 * - Saved content screen
 */
