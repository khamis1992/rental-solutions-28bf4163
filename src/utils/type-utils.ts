
/**
 * Utility type to flatten deeply nested object types
 */
export type FlattenType<T> = T extends object ? {
  [K in keyof T]: T[K]
} : T;
