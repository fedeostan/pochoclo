/**
 * useGeneratedContent Hook - Real-time Firestore Listener for AI Content
 *
 * This custom hook listens to Firestore for generated content updates.
 * It's the "receiving end" of the content generation system.
 *
 * WHAT IS A CUSTOM HOOK?
 * A custom hook is a JavaScript function that starts with "use" and can call
 * other hooks. It lets you extract component logic into reusable functions.
 * Think of it as a way to share stateful logic between components.
 *
 * WHAT IS onSnapshot?
 * Firestore's onSnapshot creates a real-time listener that fires whenever
 * the document changes. Unlike a one-time fetch, it automatically updates
 * when data changes - perfect for our use case where n8n writes content
 * asynchronously.
 *
 * DATA FLOW:
 * 1. Component requests content (dispatches requestContent thunk)
 * 2. Thunk calls webhook, returns requestId
 * 3. This hook starts listening to /users/{userId}/generatedContent/{requestId}
 * 4. n8n processes request, writes content to Firestore
 * 5. onSnapshot fires, hook dispatches contentReceived action
 * 6. Redux state updates, component re-renders with content
 *
 * USAGE:
 * ```tsx
 * const { isListening, error } = useGeneratedContent(userId);
 *
 * // The hook automatically:
 * // - Starts listening when pendingRequestId exists
 * // - Dispatches contentReceived when content arrives
 * // - Handles errors and timeouts
 * // - Cleans up listener on unmount
 * ```
 *
 * WHY SEPARATE FROM contentSlice?
 * - Hooks are for React component lifecycle (useEffect, cleanup)
 * - Slices are for state management (reducers, actions)
 * - This separation follows React best practices
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectPendingRequestId,
  contentReceived,
  contentError,
  addToContentHistory,
} from '@/store/slices/contentSlice';
import { GeneratedContent, ContentHistoryEntry } from '@/types/content';

/**
 * Content Listener Configuration
 *
 * These values control the behavior of the listener.
 * Adjust based on your n8n workflow's typical processing time.
 */
const CONFIG = {
  /**
   * Timeout in milliseconds
   *
   * How long to wait for content before giving up.
   * AI generation typically takes 10-30 seconds.
   * We set 60 seconds to be safe.
   */
  TIMEOUT_MS: 60_000,

  /**
   * Error messages
   *
   * User-friendly messages for different error scenarios.
   */
  ERRORS: {
    TIMEOUT: 'Content generation is taking too long. Please try again.',
    GENERATION_FAILED: 'Failed to generate content. Please try again.',
  },
};

/**
 * Hook Return Type
 *
 * What the hook exposes to consuming components.
 */
interface UseGeneratedContentReturn {
  /** True when actively listening for content */
  isListening: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Manually retry/restart the listener */
  retry: () => void;
}

/**
 * useGeneratedContent Hook
 *
 * Main hook for listening to generated content from Firestore.
 *
 * @param userId - The Firebase Auth UID of the current user
 * @returns Object with isListening, error, and retry function
 *
 * LIFECYCLE:
 * 1. When pendingRequestId changes to non-null, start listening
 * 2. When content arrives with status "completed", dispatch success
 * 3. When content arrives with status "error", dispatch error
 * 4. When timeout expires, dispatch timeout error
 * 5. When pendingRequestId becomes null, stop listening
 * 6. On unmount, clean up listener
 */
export function useGeneratedContent(userId: string | null): UseGeneratedContentReturn {
  /**
   * Get Redux state and dispatch
   *
   * useAppSelector: Read from Redux store
   * useAppDispatch: Get dispatch function for actions
   */
  const dispatch = useAppDispatch();
  const pendingRequestId = useAppSelector(selectPendingRequestId);

  /**
   * Local State
   *
   * isListening: Are we currently subscribed to Firestore?
   * localError: Error message for this hook instance
   */
  const [isListening, setIsListening] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  /**
   * Refs for cleanup
   *
   * Refs persist across renders without causing re-renders.
   * We use them for:
   * - unsubscribe: Firestore listener cleanup function
   * - timeoutId: Timeout timer reference
   *
   * WHY REFS?
   * If we used state, changing them would cause re-renders.
   * We only need these for cleanup, not for rendering.
   */
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Cleanup Function
   *
   * Clears all listeners and timers.
   * Called when:
   * - Component unmounts
   * - pendingRequestId becomes null
   * - Content is received
   * - Error occurs
   *
   * IMPORTANT: Always clean up subscriptions to prevent memory leaks!
   */
  const cleanup = useCallback(() => {
    // Clear Firestore listener
    if (unsubscribeRef.current) {
      console.log('[useGeneratedContent] Cleaning up Firestore listener');
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsListening(false);
  }, []);

  /**
   * Handle Successful Content Reception
   *
   * Called when Firestore document has status "completed".
   * Dispatches Redux action and adds to history.
   */
  const handleContentReceived = useCallback(
    (content: GeneratedContent) => {
      console.log('[useGeneratedContent] Content received:', content.requestId);

      // Dispatch to Redux
      dispatch(contentReceived(content));

      // Add to content history for anti-repetition
      if (content.topicSummary && content.content?.category) {
        /**
         * Create history entry with ISO string for generatedAt.
         * If content.generatedAt is null, use current time as ISO string.
         */
        const historyEntry: ContentHistoryEntry = {
          requestId: content.requestId,
          topicSummary: content.topicSummary,
          category: content.content.category,
          generatedAt: content.generatedAt || new Date().toISOString(),
          viewed: true,
          saved: false,
        };
        dispatch(addToContentHistory(historyEntry));
      }

      // Cleanup
      cleanup();
      setLocalError(null);
    },
    [dispatch, cleanup]
  );

  /**
   * Handle Content Error
   *
   * Called when:
   * - Firestore document has status "error"
   * - Timeout expires
   * - Firestore listener encounters an error
   */
  const handleError = useCallback(
    (message: string) => {
      console.error('[useGeneratedContent] Error:', message);

      // Dispatch to Redux
      dispatch(contentError(message));

      // Set local error
      setLocalError(message);

      // Cleanup
      cleanup();
    },
    [dispatch, cleanup]
  );

  /**
   * Retry Function
   *
   * Exposed to components for manual retry.
   * Clears error state so user can try again.
   */
  const retry = useCallback(() => {
    setLocalError(null);
    // The useEffect will restart the listener if pendingRequestId exists
  }, []);

  /**
   * Main Effect - Start/Stop Listener
   *
   * This effect runs when pendingRequestId or userId changes.
   *
   * DEPENDENCY ARRAY:
   * [pendingRequestId, userId, handleContentReceived, handleError, cleanup]
   *
   * Effect runs when any of these change.
   * We include callback functions because they use dispatch.
   */
  useEffect(() => {
    // Don't listen if no pending request or no user
    if (!pendingRequestId || !userId) {
      cleanup();
      return;
    }

    console.log('[useGeneratedContent] Starting listener for:', pendingRequestId);

    // Build Firestore document reference
    // Path: /users/{userId}/generatedContent/{requestId}
    const docRef = doc(db, 'users', userId, 'generatedContent', pendingRequestId);

    // Start listening
    setIsListening(true);
    setLocalError(null);

    /**
     * Firestore onSnapshot Listener
     *
     * This fires immediately with current data (if exists) and then
     * again whenever the document changes.
     *
     * DOCUMENT STATES:
     * 1. Document doesn't exist yet - n8n hasn't written anything
     * 2. status: "processing" - n8n is working on it
     * 3. status: "completed" - Content is ready!
     * 4. status: "error" - Something went wrong
     */
    unsubscribeRef.current = onSnapshot(
      docRef,
      (snapshot) => {
        // Document doesn't exist yet - this is normal, n8n hasn't written yet
        if (!snapshot.exists()) {
          console.log('[useGeneratedContent] Document not found yet, waiting...');
          return;
        }

        // Get the document data
        const data = snapshot.data();
        console.log('[useGeneratedContent] Document update:', data?.status);

        // Type assertion - we know the structure from our types
        /**
         * Convert Firestore Timestamp to ISO string for Redux compatibility.
         *
         * Firestore stores dates as Timestamp objects with a toDate() method.
         * We convert to ISO string because Redux requires serializable values.
         *
         * toDate() → Date object → toISOString() → "2024-01-15T10:30:00.000Z"
         */
        const content: GeneratedContent = {
          requestId: data.requestId,
          status: data.status,
          content: data.content,
          topicSummary: data.topicSummary,
          generatedAt: data.generatedAt?.toDate?.()?.toISOString?.() || null,
          error: data.error,
        };

        // Handle based on status
        switch (content.status) {
          case 'completed':
            handleContentReceived(content);
            break;

          case 'error':
            handleError(content.error || CONFIG.ERRORS.GENERATION_FAILED);
            break;

          case 'pending':
            // Still processing, keep waiting
            console.log('[useGeneratedContent] Still processing...');
            break;

          default:
            console.warn('[useGeneratedContent] Unknown status:', content.status);
        }
      },
      (error) => {
        /**
         * Firestore listener error handler
         *
         * Common error types:
         * - "Missing or insufficient permissions": Security rules blocked access
         * - "PERMISSION_DENIED": User not authenticated or wrong userId
         * - Network errors: Device offline
         *
         * DEBUGGING TIPS:
         * 1. Check Firebase console → Firestore → Rules to see rule violations
         * 2. Verify userId matches the authenticated user's UID
         * 3. Check if the document path exists
         * 4. Ensure security rules allow read access
         */
        console.error('[useGeneratedContent] Firestore error:', error);
        console.error('[useGeneratedContent] Error code:', (error as any)?.code);
        console.error('[useGeneratedContent] Attempting to access:', {
          userId,
          requestId: pendingRequestId,
          path: `users/${userId}/generatedContent/${pendingRequestId}`,
        });

        // Provide user-friendly error message based on error type
        const errorCode = (error as any)?.code;
        let userMessage = `Failed to listen for content: ${error.message}`;

        if (
          errorCode === 'permission-denied' ||
          error.message?.includes('permission')
        ) {
          userMessage =
            'Access denied. Please sign out and sign in again, or check Firebase security rules.';
          console.error(
            '[useGeneratedContent] PERMISSION ERROR - Possible causes:',
            '\n  1. User is not authenticated',
            '\n  2. Security rules deny access to this path',
            '\n  3. userId does not match authenticated user UID',
            '\n  Check Firebase Console → Firestore → Rules for more details'
          );
        }

        handleError(userMessage);
      }
    );

    /**
     * Timeout Handler
     *
     * If content doesn't arrive within TIMEOUT_MS, give up.
     * This prevents infinite loading states.
     */
    timeoutRef.current = setTimeout(() => {
      console.warn('[useGeneratedContent] Timeout waiting for content');
      handleError(CONFIG.ERRORS.TIMEOUT);
    }, CONFIG.TIMEOUT_MS);

    /**
     * Cleanup Function
     *
     * Returned from useEffect, called when:
     * - Dependencies change (pendingRequestId, userId)
     * - Component unmounts
     *
     * ALWAYS clean up subscriptions!
     */
    return () => {
      cleanup();
    };
  }, [pendingRequestId, userId, handleContentReceived, handleError, cleanup]);

  /**
   * Return Hook Values
   *
   * Components can use these to:
   * - Show listening indicator
   * - Display errors
   * - Retry failed requests
   */
  return {
    isListening,
    error: localError,
    retry,
  };
}

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. CUSTOM HOOKS
 *    Functions starting with "use" can call other hooks.
 *    They let you extract and share stateful logic.
 *    Each component using this hook gets its own state.
 *
 * 2. useEffect CLEANUP
 *    The function returned from useEffect is the "cleanup".
 *    It runs before the effect runs again and on unmount.
 *    CRITICAL for subscriptions to prevent memory leaks!
 *
 * 3. useCallback
 *    Memoizes functions so they have stable references.
 *    Without this, functions are recreated every render,
 *    which would cause useEffect to run more than needed.
 *
 * 4. useRef vs useState
 *    - useState: Causes re-render when changed
 *    - useRef: Persists value without re-render
 *    Use refs for values you need to track but don't render.
 *
 * 5. DEPENDENCY ARRAYS
 *    [dep1, dep2] tells React when to re-run the effect.
 *    Missing dependencies = stale closures = bugs!
 *    ESLint will warn you about missing deps.
 *
 * 6. onSnapshot BEHAVIOR
 *    - Fires immediately with current data
 *    - Fires again on every change
 *    - Returns unsubscribe function
 *    - Handles reconnection automatically
 *
 * 7. ERROR BOUNDARIES
 *    This hook handles errors internally, but for production
 *    consider wrapping components in Error Boundaries.
 *
 * TESTING TIP:
 * Mock Firestore and test the hook with @testing-library/react-hooks:
 * ```typescript
 * jest.mock('firebase/firestore');
 * const { result } = renderHook(() => useGeneratedContent('user123'));
 * expect(result.current.isListening).toBe(false);
 * ```
 */

export default useGeneratedContent;
