/**
 * Class Name Utility (cn)
 *
 * A utility function for merging Tailwind CSS class names.
 * Combines the power of clsx and tailwind-merge.
 *
 * WHY WE NEED THIS:
 * When building components, we often need to:
 * 1. Combine multiple class strings
 * 2. Handle conditional classes
 * 3. Allow overriding default classes with custom ones
 *
 * Without proper merging, Tailwind classes can conflict:
 * - "p-4 p-2" would apply both, last one "wins" but first is still in string
 * - "bg-blue-500 bg-red-500" - same issue
 *
 * tailwind-merge intelligently merges these, keeping only the final value.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn - Class Name Utility
 *
 * Combines clsx and tailwind-merge for the best of both worlds:
 * - clsx: Handles conditional classes, arrays, and objects
 * - tailwind-merge: Resolves Tailwind class conflicts intelligently
 *
 * @example
 * // Basic usage - combine classes
 * cn("p-4", "bg-primary") // => "p-4 bg-primary"
 *
 * @example
 * // Conditional classes
 * cn("btn", isActive && "btn-active") // => "btn btn-active" or just "btn"
 *
 * @example
 * // Override defaults in components
 * cn("p-4 bg-primary", customClassName) // customClassName can override p-4 or bg-primary
 *
 * @example
 * // Object syntax for multiple conditions
 * cn("base", {
 *   "active": isActive,
 *   "disabled": isDisabled,
 * })
 *
 * @param inputs - Any number of class values (strings, objects, arrays, etc.)
 * @returns A single merged class string with conflicts resolved
 */
export function cn(...inputs: ClassValue[]): string {
  // Step 1: clsx processes the inputs
  // - Joins strings with spaces
  // - Filters out falsy values (false, null, undefined, "")
  // - Handles objects like { "class": condition }
  //
  // Step 2: twMerge resolves Tailwind conflicts
  // - "p-4 p-2" becomes "p-2"
  // - "bg-red-500 bg-blue-500" becomes "bg-blue-500"
  return twMerge(clsx(inputs));
}
