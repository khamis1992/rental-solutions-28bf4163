
/**
 * Utility types to help with TypeScript complex type issues
 */

/**
 * Simplifies complex nested types to avoid "excessively deep" TypeScript errors
 * This is useful for mutations and complex nested objects
 * 
 * @template T The complex type to simplify
 */
export type Simplify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Creates a simpler type for mutation variables
 * Helps avoid excessively deep type instantiation errors
 * 
 * @template T The type of the entity being updated
 * @template K Keys that should be included in the update (optional)
 */
export type MutationVariables<T, K extends keyof T = keyof T> = {
  id: string;
  data: Partial<Pick<T, K>>;
};

/**
 * Generic type for API response objects
 */
export type ApiResponse<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: {
    message: string;
    status?: number;
  };
};

/**
 * Type for paginated responses
 */
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/**
 * Creates a flat, non-recursive version of complex types
 * Specifically designed to prevent "excessively deep" TypeScript errors
 * 
 * @template T The complex type to flatten
 */
export type FlattenType<T> = {
  [P in keyof T]: T[P];
};

/**
 * Simplified mutation result type
 * Used to avoid deep type instantiation issues in mutation return types
 */
export type SimpleMutationResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Simpler type for function return values that might be complex
 * Useful for avoiding deep type instantiation errors
 * 
 * @template T The base type to simplify
 */
export type SimpleReturnType<T> = T extends object ? Record<string, any> : T;

/**
 * A very basic mutation result type to completely avoid TypeScript deep instantiation issues
 */
export interface BasicMutationResult {
  mutateAsync: (variables: any) => Promise<any>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Creates a static type that doesn't have reference to deeply nested generics
 * This helps with TypeScript's type instantiation depth errors
 */
export type Concrete<T> = T extends infer U ? { [K in keyof U]: Concrete<U[K]> } : never;

/**
 * Represents a field that might be null or undefined
 */
export type Maybe<T> = T | null | undefined;

/**
 * Creates a wrapper type that preserves the original type but erases the 
 * complex type relationships to avoid TypeScript limits
 */
export type Opaque<T, K extends string> = T & { __brand: K };

/**
 * Creates simple typing for database IDs to avoid TypeScript errors
 * while still maintaining type safety
 */
export type EntityId = Opaque<string, 'EntityId'>;

/**
 * Type guard for checking if a property exists at runtime
 */
export function hasProperty<T, K extends string>(obj: T, prop: K): obj is T & Record<K, unknown> {
  return obj !== null && obj !== undefined && Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Safely cast a value to a specific enum type
 * @param value Value to cast
 * @param enumType Enum object
 * @param defaultValue Default value if casting fails
 */
export function safeEnumCast<T extends Record<string, string | number>>(
  value: unknown,
  enumType: T,
  defaultValue: T[keyof T]
): T[keyof T] {
  if (value === null || value === undefined) return defaultValue;
  
  const values = Object.values(enumType);
  return values.includes(value as any) ? (value as T[keyof T]) : defaultValue;
}

/**
 * Safe type assertion that checks at runtime
 */
export function assertType<T>(
  value: unknown, 
  validator: (val: unknown) => boolean, 
  errorMsg = 'Type assertion failed'
): asserts value is T {
  if (!validator(value)) {
    throw new TypeError(errorMsg);
  }
}
