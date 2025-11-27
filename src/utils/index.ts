/**
 * Utils Barrel Export
 *
 * This file re-exports all utility functions from the utils folder.
 * It allows clean imports like:
 *
 * import { cn, validateEmail, validatePassword } from "@/utils";
 *
 * Instead of:
 * import { cn } from "@/utils/cn";
 * import { validateEmail } from "@/utils/validation";
 *
 * BARREL EXPORT PATTERN:
 * Centralizes exports for a cleaner API and easier refactoring.
 * If you move a utility to a different file, just update this file.
 */

// Class name utility for Tailwind
export { cn } from "./cn";

// Form validation utilities
export {
  // Individual validators
  isValidEmail,
  isValidPassword,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateName,
  validateRequired,
  // Form validators
  validateSignUpForm,
  validateSignInForm,
  hasErrors,
  // Types
  type SignUpFormData,
  type SignUpFormErrors,
  type SignInFormErrors,
} from "./validation";
