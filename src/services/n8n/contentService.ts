/**
 * n8n Content Service
 *
 * This service handles communication with the n8n webhook for AI content generation.
 * It implements a "fire-and-forget" pattern - we send the request and don't wait
 * for the content. The actual content arrives via Firestore listener (see Phase 3).
 *
 * WHAT IS n8n?
 * n8n is a workflow automation tool (like Zapier, but self-hostable).
 * It can receive webhooks, process data, call AI APIs, and write to databases.
 * In our case, n8n:
 * 1. Receives our POST request with user preferences
 * 2. Calls an AI service (like Claude or GPT) to generate content
 * 3. Writes the result to Firestore
 *
 * WHY FIRE-AND-FORGET?
 * AI content generation can take 10-30 seconds. Instead of keeping an HTTP
 * connection open that long (which can timeout), we:
 * 1. Send the request (get 200 OK immediately)
 * 2. Display a loading animation
 * 3. Listen for the result in Firestore (real-time updates)
 *
 * This pattern is more reliable and provides better UX than waiting.
 *
 * ARCHITECTURE:
 * ┌─────────────┐    POST      ┌─────────────┐
 * │   App       │ ──────────►  │   n8n       │
 * │             │   200 OK     │  Workflow   │
 * │             │ ◄──────────  │             │
 * └─────────────┘              └──────┬──────┘
 *       │                             │
 *       │                             │ AI Processing
 *       │                             │ (10-30 seconds)
 *       │                             ▼
 *       │                      ┌─────────────┐
 *       │   onSnapshot         │  Firestore  │
 *       └─────────────────────►│             │
 *                              └─────────────┘
 */

import * as Crypto from 'expo-crypto';
import { ContentRequest, TriggerContentResult } from '@/types/content';

/**
 * Get the n8n webhook URL from environment variables
 *
 * WHY ENVIRONMENT VARIABLE?
 * - Different URLs for development/production
 * - Keeps sensitive URLs out of source code
 * - Easy to change without code modification
 *
 * The EXPO_PUBLIC_ prefix is required by Expo to expose
 * environment variables to the client-side code.
 */
const N8N_WEBHOOK_URL = process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL;

/**
 * Trigger Content Generation
 *
 * Sends a POST request to the n8n webhook to start AI content generation.
 * Returns immediately after getting 200 OK - doesn't wait for content.
 *
 * @param userId - Firebase Auth UID of the requesting user
 * @param displayName - User's display name for content personalization
 * @param categories - Array of topic categories the user is interested in
 * @param dailyLearningMinutes - How many minutes of content to generate
 * @param contentHistory - Previous topic summaries to avoid repetition
 *
 * @returns Object with requestId, success flag, and optional error
 *
 * USAGE:
 * ```typescript
 * const result = await triggerContentGeneration(
 *   'user123',
 *   'John',
 *   ['technology', 'custom:blockchain'],
 *   15,
 *   ['Previous topic 1', 'Previous topic 2']
 * );
 *
 * if (result.success) {
 *   // Start listening for content with result.requestId
 * } else {
 *   // Show error: result.error
 * }
 * ```
 *
 * ERROR HANDLING:
 * - Network errors (no internet) → returns success: false
 * - HTTP errors (4xx, 5xx) → returns success: false
 * - Missing webhook URL → returns success: false
 *
 * Note: The function ALWAYS returns a requestId, even on failure.
 * This allows the app to track the failed request if needed.
 */
export async function triggerContentGeneration(
  userId: string,
  displayName: string,
  categories: string[],
  dailyLearningMinutes: number,
  contentHistory: string[]
): Promise<TriggerContentResult> {
  /**
   * Generate Unique Request ID
   *
   * UUID v4 creates a random unique identifier like:
   * "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
   *
   * WHY UUID?
   * - Guaranteed uniqueness (statistically impossible to collide)
   * - No server coordination needed (generated client-side)
   * - Can be generated offline
   * - Serves as Firestore document ID for the response
   *
   * This requestId is used to:
   * 1. Track this specific request in the app
   * 2. Store the generated content in Firestore (as document ID)
   * 3. Link the Firestore listener to the correct response
   *
   * NOTE: We use expo-crypto instead of the uuid package because
   * the uuid package uses crypto.getRandomValues() which isn't
   * supported in React Native without polyfills.
   */
  const requestId = Crypto.randomUUID();

  /**
   * Build the Request Payload
   *
   * This payload contains everything n8n needs to generate personalized content.
   * The n8n workflow will use this data to:
   * - Identify the user (userId)
   * - Personalize the content (displayName, categories)
   * - Determine content length (dailyLearningMinutes)
   * - Avoid repetition (contentHistory)
   * - Store the result (requestId for document ID)
   */
  const payload: ContentRequest = {
    userId,
    displayName,
    categories,
    dailyLearningMinutes,
    contentHistory,
    requestId,
    timestamp: new Date().toISOString(),
  };

  /**
   * Check for Webhook URL Configuration
   *
   * If the environment variable isn't set, we can't make the request.
   * This should only happen in development if .env is misconfigured.
   */
  if (!N8N_WEBHOOK_URL) {
    console.error('[ContentService] N8N_WEBHOOK_URL is not configured');
    return {
      requestId,
      success: false,
      error: 'Content service is not configured',
    };
  }

  try {
    /**
     * Make the POST Request
     *
     * We use the standard fetch API:
     * - POST method (sending data)
     * - JSON content type
     * - Payload in the body
     *
     * n8n is configured to respond immediately with 200 OK,
     * so this should complete in under a second.
     */
    console.log('[ContentService] Triggering content generation:', {
      requestId,
      userId,
      categoriesCount: categories.length,
      dailyLearningMinutes,
      historyCount: contentHistory.length,
    });

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    /**
     * Check Response Status
     *
     * A 2xx status means n8n received the request successfully.
     * The actual content generation happens asynchronously.
     *
     * Note: We don't parse the response body because n8n
     * is configured to respond immediately without waiting
     * for the workflow to complete.
     */
    if (!response.ok) {
      console.error('[ContentService] HTTP error:', response.status);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('[ContentService] Request sent successfully:', requestId);

    return {
      requestId,
      success: true,
    };
  } catch (error) {
    /**
     * Handle Errors
     *
     * Common error scenarios:
     * - Network offline: TypeError: Failed to fetch
     * - Server error: HTTP 500, 502, etc.
     * - Timeout: Request took too long
     *
     * We log the error for debugging and return a user-friendly message.
     */
    console.error('[ContentService] Error triggering content generation:', error);

    // Extract error message
    let errorMessage = 'Failed to request content';
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        errorMessage = 'No internet connection. Please check your network.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      requestId,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if a content request should be triggered
 *
 * Helper function to determine if new content should be requested.
 * Used by the Home screen to decide when to auto-trigger generation.
 *
 * @param hasUnreadContent - Does the user have content they haven't read?
 * @param isPending - Is there already a request in progress?
 * @param isLoading - Is the content system currently loading?
 * @param lastFetchedAt - When was content last received?
 *
 * @returns true if new content should be requested
 *
 * TRIGGER CONDITIONS:
 * - No unread content AND no pending request AND not loading
 * - OR last content was generated more than 24 hours ago
 *
 * DO NOT TRIGGER IF:
 * - User has unread content waiting
 * - A request is already pending
 * - Content is currently loading
 */
export function shouldTriggerContentGeneration(
  hasUnreadContent: boolean,
  isPending: boolean,
  isLoading: boolean,
  lastFetchedAt: Date | null
): boolean {
  // Don't trigger if already loading (prevents infinite loop!)
  // isLoading is set immediately when thunk starts, before pendingRequestId is set
  if (isLoading) {
    console.log('[ContentService] Skip: Already loading');
    return false;
  }

  // Don't trigger if request is already pending
  if (isPending) {
    console.log('[ContentService] Skip: Request already pending');
    return false;
  }

  // Don't trigger if user has unread content
  if (hasUnreadContent) {
    console.log('[ContentService] Skip: User has unread content');
    return false;
  }

  // Trigger if no content has been fetched yet
  if (!lastFetchedAt) {
    console.log('[ContentService] Trigger: No content fetched yet');
    return true;
  }

  // Trigger if last content is older than 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (lastFetchedAt < twentyFourHoursAgo) {
    console.log('[ContentService] Trigger: Content is stale (>24h old)');
    return true;
  }

  console.log('[ContentService] Skip: Content is fresh');
  return false;
}

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. FIRE-AND-FORGET PATTERN
 *    This is a common pattern for long-running async operations:
 *    - Client sends request, gets immediate acknowledgment
 *    - Server processes asynchronously
 *    - Client polls or listens for completion
 *
 *    Benefits:
 *    - No HTTP timeout issues
 *    - Better UX (can show progress)
 *    - More reliable (server can retry if needed)
 *
 * 2. UUID GENERATION
 *    We generate the UUID client-side, not server-side because:
 *    - Client needs the ID immediately for tracking
 *    - No extra round-trip to get an ID
 *    - Works offline (can queue requests)
 *    - UUIDs are guaranteed unique, no coordination needed
 *
 * 3. ERROR HANDLING
 *    We catch all errors and return a structured result:
 *    - Always returns requestId (for tracking)
 *    - success: boolean for easy checking
 *    - error: string for user display
 *
 *    This makes error handling consistent for callers.
 *
 * 4. ENVIRONMENT VARIABLES
 *    Expo requires EXPO_PUBLIC_ prefix for client-accessible env vars.
 *    This is a security feature - other env vars aren't exposed.
 *
 *    Access pattern:
 *    process.env.EXPO_PUBLIC_XXX (client-side)
 *    process.env.SECRET_KEY (server-side only, not exposed)
 *
 * 5. LOGGING
 *    We log key events for debugging:
 *    - Request triggered (with metadata, not sensitive data)
 *    - Request succeeded
 *    - Request failed (with error)
 *
 *    In production, you might send these to an analytics service.
 *
 * 6. WEBHOOK SECURITY
 *    This is a public webhook URL (no authentication).
 *    n8n handles rate limiting and validation internally.
 *
 *    For production, consider:
 *    - Adding API key in headers
 *    - Request signing
 *    - IP allowlisting in n8n
 *
 * NEXT STEPS:
 * - Phase 2: Add contentHistoryService to fetch history before calling this
 * - Phase 3: Add contentListenerService to receive the generated content
 */
