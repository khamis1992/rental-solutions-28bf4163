
/**
 * A simplified record type to avoid excessive type instantiation
 * This can be used in place of deeply nested generic types
 */
export interface SimpleRecord {
  id?: string;
  [key: string]: any;
}
