/**
 * Auth Types
 *
 * Additional authentication types for forms and credentials.
 *
 * NOTE: SerializableUser is defined in authSlice.ts and re-exported
 * from types/index.ts. This keeps the main user type with the Redux logic.
 *
 * This file contains:
 * - Credential types for sign in/up forms
 * - Additional auth-related types
 */

/**
 * Sign In Credentials
 *
 * Required data for email/password sign in.
 */
export interface SignInCredentials {
  email: string;
  password: string;
}

/**
 * Sign Up Credentials
 *
 * Required data for creating a new account.
 */
export interface SignUpCredentials {
  email: string;
  password: string;
  displayName: string;
}
