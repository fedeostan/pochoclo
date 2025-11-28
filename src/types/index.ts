/**
 * Types Barrel Export
 *
 * This file re-exports all shared TypeScript types from the types folder.
 * Use this for types that are shared across multiple modules.
 *
 * WHEN TO PUT TYPES HERE:
 * - Types used in multiple files/folders
 * - Common data shapes (User, API responses, etc.)
 * - Types that represent domain concepts
 *
 * WHEN TO KEEP TYPES IN THEIR FILE:
 * - Component-specific props (keep in component file)
 * - Slice-specific types (can stay in slice file)
 * - Types only used in one module
 *
 * This file provides a clean import:
 * import { SerializableUser, SignInCredentials } from "@/types";
 */

// Re-export auth-related types from both locations
// (authSlice has the main definition, auth.ts has additional types)
export type { SerializableUser } from "../store/slices/authSlice";
export type { SignInCredentials, SignUpCredentials } from "./auth";

// Re-export content-related types
// Used for AI content generation system (n8n integration)
export type {
  ContentRequest,
  ContentSource,
  ContentBody,
  ContentStatus,
  GeneratedContent,
  ContentHistoryEntry,
  ContentState,
  TriggerContentResult,
} from "./content";
