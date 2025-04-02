
/**
 * A simplified record type to avoid excessive type instantiation
 * This can be used in place of deeply nested generic types
 */
export interface SimpleRecord {
  id?: string;
  [key: string]: any;
}

/**
 * A utility type to flatten complex types
 * This can help with TypeScript hitting its instantiation limit with complex nested types
 */
export type FlattenType<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Used for safely typing potentially complex nested objects
 * Helps prevent "Type instantiation is excessively deep and possibly infinite" errors
 */
export type SafeRecord<T = any> = {
  [K in keyof T]: T[K] extends object ? SafeRecord<T[K]> : T[K];
};
