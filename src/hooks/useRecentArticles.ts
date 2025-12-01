/**
 * useRecentArticles Hook - Real-time Recent Articles Listener
 *
 * This custom hook provides real-time access to the user's recent articles.
 * It sets up a Firestore listener that automatically updates when the
 * recent articles collection changes.
 *
 * WHAT DOES THIS HOOK DO?
 * - Listens to the user's recentArticles subcollection in real-time
 * - Returns the 3 most recently read articles (or fewer if not enough)
 * - Automatically updates when articles are added/removed
 * - Handles loading and error states
 * - Cleans up the listener when component unmounts
 *
 * WHY A HOOK INSTEAD OF REDUX?
 * For a small, focused data set (max 3 items), a simple hook is cleaner than
 * adding Redux complexity. This approach:
 * - Keeps state close to where it's used
 * - Avoids Redux boilerplate for simple data
 * - Is perfectly fine for data used in one place (home screen)
 *
 * WHEN TO USE REDUX INSTEAD:
 * If you need this data in multiple unrelated components, or if you need
 * to trigger actions from different parts of the app, consider moving to Redux.
 *
 * USAGE:
 * ```tsx
 * function RecentArticlesWidget() {
 *   const { articles, loading, error } = useRecentArticles();
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   if (articles.length === 0) return <EmptyState />;
 *
 *   return (
 *     <View>
 *       {articles.map(article => (
 *         <ArticleItem key={article.id} article={article} />
 *       ))}
 *     </View>
 *   );
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAppSelector } from '@/store';
import { RecentArticle, ContentBody } from '@/types/content';

/**
 * Maximum number of recent articles to display.
 * This matches the limit enforced in recentArticlesService.
 */
const MAX_RECENT_ARTICLES = 3;

/**
 * Return type for the useRecentArticles hook.
 *
 * FIELDS:
 * - articles: Array of recent articles (max 3, ordered by most recent first)
 * - loading: True while the initial data is being fetched
 * - error: Error message if something went wrong, null otherwise
 *
 * WHY SEPARATE LOADING FROM EMPTY?
 * An empty articles array could mean:
 * 1. Still loading (loading: true, articles: [])
 * 2. No recent articles (loading: false, articles: [])
 * The loading flag distinguishes these states.
 */
interface UseRecentArticlesReturn {
  articles: RecentArticle[];
  loading: boolean;
  error: string | null;
}

/**
 * useRecentArticles Hook
 *
 * Provides real-time access to the user's recent articles.
 *
 * @returns {UseRecentArticlesReturn} Object containing articles, loading state, and error
 *
 * HOW IT WORKS:
 * 1. On mount, checks if user is authenticated
 * 2. Sets up onSnapshot listener on recentArticles collection
 * 3. When data arrives, transforms Firestore documents to RecentArticle[]
 * 4. Returns articles ordered by most recently read
 * 5. On unmount, cleans up the listener to prevent memory leaks
 *
 * REAL-TIME UPDATES:
 * Because we use onSnapshot (not getDocs), the component automatically
 * re-renders when:
 * - A new article is added (user finishes reading)
 * - An article is deleted (oldest removed when 4th added)
 * - The collection is cleared
 */
export function useRecentArticles(): UseRecentArticlesReturn {
  // State for the hook's return value
  const [articles, setArticles] = useState<RecentArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get the current user from Redux auth slice
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // If no user is logged in, we can't fetch their articles
    if (!user?.uid) {
      setLoading(false);
      setArticles([]);
      return;
    }

    // Reference to the user's recentArticles subcollection
    const recentRef = collection(db, 'users', user.uid, 'recentArticles');

    // Query: get last 3 articles, ordered by most recently read
    const recentQuery = query(
      recentRef,
      orderBy('readAt', 'desc'), // Most recent first
      limit(MAX_RECENT_ARTICLES)
    );

    /**
     * Set up the real-time listener
     *
     * onSnapshot returns an unsubscribe function that we call on cleanup.
     * The callback receives a QuerySnapshot with all matching documents.
     *
     * WHY onSnapshot INSTEAD OF getDocs?
     * - getDocs is a one-time fetch (like fetch() or axios.get())
     * - onSnapshot is a real-time listener (like WebSocket)
     * - For a widget that should update immediately when new articles
     *   are added, real-time is better UX
     */
    const unsubscribe = onSnapshot(
      recentQuery,
      (snapshot) => {
        // Transform Firestore documents to our RecentArticle type
        const recentArticles: RecentArticle[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            contentBody: data.contentBody as ContentBody,
            // Convert Firestore Timestamps to ISO strings
            readAt:
              (data.readAt as Timestamp)?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            createdAt:
              (data.createdAt as Timestamp)?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
          };
        });

        setArticles(recentArticles);
        setLoading(false);
        setError(null);

        console.log(
          '[useRecentArticles] Received',
          recentArticles.length,
          'articles'
        );
      },
      (err) => {
        // Handle errors from the listener
        console.error('[useRecentArticles] Error:', err);
        setError('Failed to load recent articles');
        setLoading(false);
      }
    );

    /**
     * Cleanup function
     *
     * This runs when:
     * - The component unmounts
     * - The user changes (dependency array)
     *
     * We MUST call unsubscribe() to:
     * - Stop listening to changes (save Firebase costs)
     * - Prevent memory leaks
     * - Prevent updates to unmounted components
     */
    return () => {
      console.log('[useRecentArticles] Cleaning up listener');
      unsubscribe();
    };
  }, [user?.uid]); // Re-run effect if user changes

  return { articles, loading, error };
}

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. HOOKS VS REDUX
 *    This hook demonstrates when NOT to use Redux:
 *    - Data is used in one component (RecentArticlesWidget)
 *    - Max 3 items - no need for complex state management
 *    - Real-time listener fits naturally in a hook
 *
 *    Use Redux when:
 *    - Multiple unrelated components need the same data
 *    - You need to trigger updates from different places
 *    - Complex state transitions require middleware
 *
 * 2. CLEANUP FUNCTIONS
 *    The return value of useEffect is a cleanup function.
 *    React calls it when:
 *    - Component unmounts
 *    - Before re-running the effect (if dependencies change)
 *
 *    Always clean up subscriptions to prevent memory leaks!
 *
 * 3. DEPENDENCY ARRAY
 *    [user?.uid] means the effect re-runs when user ID changes.
 *    This handles:
 *    - User logs in (start listening)
 *    - User logs out (clean up)
 *    - User switches accounts (re-subscribe)
 *
 * 4. TYPESCRIPT GENERICS
 *    `onSnapshot<QuerySnapshot>` uses TypeScript generics.
 *    The snapshot.docs.map() returns typed documents.
 *    We cast data.contentBody as ContentBody for type safety.
 *
 * 5. ERROR HANDLING
 *    onSnapshot's second argument is an error callback.
 *    Errors can happen due to:
 *    - Network issues
 *    - Permission denied (security rules)
 *    - Invalid query
 *
 * 6. LOADING STATE
 *    We start with loading: true and set to false after first snapshot.
 *    This lets the UI show a loading indicator on initial render.
 *
 * 7. OPTIONAL CHAINING
 *    `user?.uid` safely accesses uid even if user is null/undefined.
 *    `timestamp?.toDate?.()?.toISOString()` handles missing timestamps.
 *    This defensive coding prevents runtime errors.
 */

export default useRecentArticles;
