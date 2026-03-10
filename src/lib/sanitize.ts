/**
 * Sanitize a string for safe SQL interpolation.
 * Only allows alphanumeric characters, hyphens, underscores, and dots.
 * Throws on invalid input to prevent SQL injection.
 */
export function sanitizeSqlValue(value: string): string {
  if (!/^[a-zA-Z0-9_.-]+$/.test(value)) {
    throw new Error(`Unsafe SQL value: "${value}"`);
  }
  return value;
}
