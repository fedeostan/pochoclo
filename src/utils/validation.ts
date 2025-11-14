/**
 * Form Validation Utilities
 *
 * This file contains validation functions for form inputs used throughout
 * the authentication flow. Validation is crucial for:
 * 1. User experience - Immediate feedback on input errors
 * 2. Security - Enforce password requirements
 * 3. Data quality - Ensure valid data reaches the server
 * 4. Reduced API calls - Catch errors before submission
 *
 * VALIDATION STRATEGY:
 * We use client-side validation for immediate feedback, but ALWAYS
 * validate on the server too (never trust client-side validation alone).
 *
 * Client-side validation:
 * ✓ Instant feedback (no network delay)
 * ✓ Better UX (catch typos immediately)
 * ✓ Reduced server load (fewer invalid requests)
 * ✗ Can be bypassed (users can disable JavaScript)
 *
 * Server-side validation:
 * ✓ Cannot be bypassed (security)
 * ✓ Can check against database (email uniqueness)
 * ✓ Authoritative (final word on validity)
 * ✗ Network delay (slower feedback)
 *
 * BEST PRACTICE: Use both! Client-side for UX, server-side for security.
 */

/**
 * Email Validation
 *
 * Validates email format using a regular expression (regex).
 *
 * WHAT THIS REGEX CHECKS:
 * - Starts with alphanumeric characters, dots, underscores, or hyphens
 * - Contains an @ symbol
 * - Has a domain name (alphanumeric, dots, hyphens)
 * - Ends with a TLD (top-level domain) of 2+ letters
 *
 * EXAMPLES:
 * ✓ Valid: "user@example.com", "test.user@domain.co.uk", "user+tag@gmail.com"
 * ✗ Invalid: "notanemail", "@example.com", "user@", "user@domain"
 *
 * NOTE: Email validation is complex! This regex covers common cases but
 * not all valid email formats. For production, you might use a library
 * like "email-validator" or rely on server-side validation.
 *
 * @param email - The email address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  // Empty email is invalid
  if (!email || email.trim() === '') {
    return false;
  }

  /**
   * Email Regex Breakdown:
   * ^                    - Start of string
   * [a-zA-Z0-9._+-]+     - One or more: letters, numbers, dot, underscore, plus, hyphen
   * @                    - Literal @ symbol
   * [a-zA-Z0-9.-]+       - One or more: letters, numbers, dot, hyphen (domain)
   * \.                   - Literal dot (period)
   * [a-zA-Z]{2,}         - Two or more letters (TLD like .com, .co.uk)
   * $                    - End of string
   */
  const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return emailRegex.test(email.trim());
}

/**
 * Get Email Error Message
 *
 * Returns a user-friendly error message for invalid emails.
 * Returns undefined if email is valid.
 *
 * This separates validation (isValidEmail) from error messaging,
 * making it easy to change messages without changing validation logic.
 *
 * @param email - The email to validate
 * @returns Error message or undefined if valid
 */
export function validateEmail(email: string): string | undefined {
  if (!email || email.trim() === '') {
    return 'Email is required';
  }

  if (!isValidEmail(email)) {
    return 'Please enter a valid email address';
  }

  return undefined; // No error
}

/**
 * Password Validation
 *
 * Validates password strength based on security requirements.
 *
 * PASSWORD REQUIREMENTS:
 * - Minimum 8 characters (industry standard)
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*(),.?":{}|<>)
 *
 * WHY THESE REQUIREMENTS?
 * - Length: Longer = harder to crack (8 is minimum, 12+ is better)
 * - Character variety: Makes brute-force attacks harder
 * - Uppercase/lowercase: Increases possible combinations
 * - Numbers: Further increases combinations
 * - Special chars: Maximum security
 *
 * SECURITY NOTE:
 * These requirements help prevent weak passwords, but also consider:
 * - Password strength meters (visual feedback)
 * - Check against common password lists ("password123" should fail)
 * - Rate limiting on login attempts
 * - Two-factor authentication (even strong passwords can be phished)
 *
 * @param password - The password to validate
 * @returns true if valid, false otherwise
 */
export function isValidPassword(password: string): boolean {
  if (!password || password.length < 8) {
    return false;
  }

  // Check for uppercase letter
  const hasUppercase = /[A-Z]/.test(password);

  // Check for lowercase letter
  const hasLowercase = /[a-z]/.test(password);

  // Check for number
  const hasNumber = /[0-9]/.test(password);

  // Check for special character
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  // All requirements must be met
  return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
}

/**
 * Get Password Error Message
 *
 * Returns specific feedback about password requirements.
 * Tells users exactly what's missing instead of generic "invalid password".
 *
 * GOOD UX:
 * ✓ "Password must be at least 8 characters"
 * ✓ "Password must include an uppercase letter"
 * ✗ "Invalid password"
 * ✗ "Password doesn't meet requirements"
 *
 * @param password - The password to validate
 * @returns Error message or undefined if valid
 */
export function validatePassword(password: string): string | undefined {
  if (!password || password.trim() === '') {
    return 'Password is required';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must include an uppercase letter';
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must include a lowercase letter';
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must include a number';
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must include a special character (!@#$%^&* etc.)';
  }

  return undefined; // No error
}

/**
 * Validate Password Match
 *
 * Checks if password and confirm password match.
 * Used on sign-up screens where users must type password twice.
 *
 * WHY CONFIRM PASSWORD?
 * - Users often make typos
 * - Password fields are hidden (can't see typos)
 * - Better to catch mismatches now than during login
 *
 * @param password - The original password
 * @param confirmPassword - The confirmation password
 * @returns Error message or undefined if they match
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): string | undefined {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return 'Please confirm your password';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  return undefined; // No error
}

/**
 * Name Validation
 *
 * Validates full name input.
 *
 * REQUIREMENTS:
 * - Not empty
 * - At least 2 characters
 * - Only letters, spaces, hyphens, and apostrophes
 * - No numbers or special characters (except - and ')
 *
 * EXAMPLES:
 * ✓ Valid: "John Doe", "Mary-Jane O'Brien", "José García"
 * ✗ Invalid: "J", "John123", "Name@Email", ""
 *
 * NOTE: Name validation is tricky! Different cultures have different
 * naming conventions. This validation is relatively permissive.
 * Consider making it even more flexible for international users.
 *
 * @param name - The name to validate
 * @returns Error message or undefined if valid
 */
export function validateName(name: string): string | undefined {
  if (!name || name.trim() === '') {
    return 'Name is required';
  }

  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }

  // Allow letters (including accented), spaces, hyphens, and apostrophes
  // \p{L} matches any letter in any language (requires 'u' flag)
  const nameRegex = /^[\p{L}\s'-]+$/u;

  if (!nameRegex.test(name)) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes';
  }

  return undefined; // No error
}

/**
 * Required Field Validation
 *
 * Generic validation for any required field.
 * Checks that the field is not empty or just whitespace.
 *
 * @param value - The value to check
 * @param fieldName - Name of the field (for error message)
 * @returns Error message or undefined if valid
 */
export function validateRequired(
  value: string,
  fieldName: string = 'This field'
): string | undefined {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }

  return undefined; // No error
}

/**
 * Validate Entire Sign-Up Form
 *
 * Validates all fields for the sign-up screen at once.
 * Returns an object with errors for each field.
 *
 * This is useful for:
 * - Form submission validation (check everything before submitting)
 * - Showing all errors at once (vs. one at a time)
 *
 * @param formData - Object containing all form fields
 * @returns Object with error messages (empty object if no errors)
 */
export interface SignUpFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignUpFormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function validateSignUpForm(
  formData: SignUpFormData
): SignUpFormErrors {
  const errors: SignUpFormErrors = {};

  // Validate each field
  const nameError = validateName(formData.fullName);
  if (nameError) errors.fullName = nameError;

  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;

  const confirmError = validatePasswordMatch(
    formData.password,
    formData.confirmPassword
  );
  if (confirmError) errors.confirmPassword = confirmError;

  return errors;
}

/**
 * Validate Sign-In Form
 *
 * Simpler validation for sign-in (just email and password required).
 * We don't validate password strength on sign-in since the password
 * already exists in the database.
 *
 * @param email - Email to validate
 * @param password - Password to check (just required, not strength)
 * @returns Object with error messages
 */
export interface SignInFormErrors {
  email?: string;
  password?: string;
}

export function validateSignInForm(
  email: string,
  password: string
): SignInFormErrors {
  const errors: SignInFormErrors = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validateRequired(password, 'Password');
  if (passwordError) errors.password = passwordError;

  return errors;
}

/**
 * Check if form has any errors
 *
 * Helper function to check if an errors object has any errors.
 * Useful for enabling/disabling submit buttons.
 *
 * @param errors - Object with potential error messages
 * @returns true if any errors exist, false otherwise
 */
export function hasErrors(errors: object): boolean {
  return Object.values(errors).some((error) => error !== undefined);
}

/**
 * LEARNING NOTES:
 *
 * 1. REGULAR EXPRESSIONS (REGEX)
 *    Regex are patterns for matching text. They're powerful but complex.
 *
 *    Common patterns:
 *    - ^ = start of string
 *    - $ = end of string
 *    - [a-z] = any lowercase letter
 *    - [0-9] = any digit
 *    - + = one or more of previous pattern
 *    - * = zero or more
 *    - ? = zero or one
 *    - . = any character
 *    - \. = literal dot (escape special chars)
 *
 *    Learn more: regex101.com (test and learn regex interactively)
 *
 * 2. VALIDATION PATTERNS
 *    Common approaches:
 *    - is* functions: Return boolean (isValidEmail)
 *    - validate* functions: Return error message or undefined
 *    - validate*Form functions: Check multiple fields at once
 *
 *    This separation makes code flexible and reusable.
 *
 * 3. USER-FRIENDLY ERROR MESSAGES
 *    Good error messages:
 *    ✓ Specific: "Password must include a number"
 *    ✓ Actionable: Tell user what to do
 *    ✓ Polite: No blame ("Invalid!" is harsh)
 *
 *    Bad error messages:
 *    ✗ Generic: "Error"
 *    ✗ Technical: "Regex pattern mismatch"
 *    ✗ Unclear: "Invalid input"
 *
 * 4. WHEN TO VALIDATE
 *    Different timing strategies:
 *    - On blur: Validate when user leaves field (good UX)
 *    - On change: Validate as user types (immediate feedback)
 *    - On submit: Validate when form submitted (final check)
 *
 *    Best practice: Combine approaches
 *    - On blur for field-level validation
 *    - On submit for form-level validation
 *    - On change for password strength meters
 *
 * 5. SECURITY CONSIDERATIONS
 *    - Never rely solely on client-side validation
 *    - Always validate on server too
 *    - Use HTTPS to protect passwords in transit
 *    - Hash passwords on server (never store plain text)
 *    - Consider rate limiting to prevent brute force
 *    - Use Supabase Auth (handles most security for us)
 *
 * 6. INTERNATIONALIZATION (i18n)
 *    Names vary by culture:
 *    - Some cultures use one name
 *    - Some have long names with many parts
 *    - Accented characters are common (José, François, etc.)
 *    - Some use non-Latin scripts (日本, العربية, etc.)
 *
 *    Our validation uses \p{L} (any Unicode letter) to support
 *    international names. This is more inclusive than just [a-zA-Z].
 *
 * 7. PASSWORD STRENGTH
 *    Our requirements (8+ chars, mixed case, numbers, symbols) are
 *    a minimum. Better passwords are:
 *    - 12+ characters (harder to crack)
 *    - Passphrases ("correct-horse-battery-staple")
 *    - Unique per site (use password manager)
 *    - Not based on personal info
 *
 * USAGE EXAMPLES:
 *
 * Individual field validation:
 * ```tsx
 * const emailError = validateEmail(email);
 * setEmailError(emailError);
 * ```
 *
 * Form validation on submit:
 * ```tsx
 * const handleSubmit = () => {
 *   const errors = validateSignUpForm({ fullName, email, password, confirmPassword });
 *   if (hasErrors(errors)) {
 *     setFormErrors(errors);
 *     return;
 *   }
 *   // Proceed with submission
 * };
 * ```
 *
 * Real-time validation:
 * ```tsx
 * <TextInput
 *   value={email}
 *   onChangeText={setEmail}
 *   onBlur={() => setEmailError(validateEmail(email))}
 *   error={emailError}
 * />
 * ```
 */
