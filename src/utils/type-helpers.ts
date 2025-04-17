
import { exists } from '@/utils/database-type-helpers';

/**
 * Checks if a value exists (is not null or undefined)
 */
export { exists };

/**
 * Additional type helper functions can be added here
 */

// Helper function to check if value exists (duplicated here for convenience)
export function valueExists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
