
/**
 * Helper functions to safely cast database IDs and column values
 * for type safety with the Supabase client
 */

// Cast a string to a valid UUID for database operations
export function castToUUID<T extends string>(id: T): string {
  return id;
}

// Type helpers for database column names
export function asStatusColumn(status: string): string {
  return status;
}

export function asVehicleId(id: string): string {
  return id;
}

export function asCustomerId(id: string): string {
  return id;
}

export function asProfileId(id: string): string {
  return id;
}

export function asPaymentId(id: string): string {
  return id;
}

// Function to check if a value exists (not null or undefined)
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Safe property accessor
export const getPropertySafely = <T extends object, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): T[K] | undefined => {
  if (!obj) return undefined;
  return obj[key];
};
