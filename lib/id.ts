/**
 * ID Generation Utility
 * 
 * Generate unique IDs for database records
 */

/**
 * Generate a unique ID using crypto.randomUUID
 * Falls back to a timestamp-based ID if crypto is not available
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback: timestamp + random string
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 11);
  return `${timestamp}-${random}`;
}
