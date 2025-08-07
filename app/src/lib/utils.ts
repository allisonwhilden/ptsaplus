import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Escapes special characters in a string for use in SQL LIKE/ILIKE patterns
 * This prevents SQL injection by escaping wildcards and the escape character
 * @param input - The string to escape
 * @returns The escaped string safe for use in LIKE/ILIKE patterns
 */
export function escapeSqlLikePattern(input: string): string {
  // Order matters: escape backslash first since it's the escape character
  return input
    .replace(/\\/g, '\\\\')  // Escape backslash
    .replace(/%/g, '\\%')    // Escape percent wildcard
    .replace(/_/g, '\\_');   // Escape underscore wildcard
}