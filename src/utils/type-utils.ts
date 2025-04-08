
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
export type BasicMutationResult = {
  mutateAsync: (args: any) => Promise<any>;
  isPending: boolean;
  isError?: boolean;
  error?: unknown;
};
