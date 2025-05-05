
/**
 * Root validation module that re-exports all validation functions
 */

// Re-export all validation functions from specific categories
export * from './array-validators';
export * from './basic-validators';
export * from './date-validators';
export * from './file-validators';
export * from './geo-validators';
export * from './payment-validators';
export * from './type-validators';
export * from './user-input-validators';

// Additional utility functions for object validation
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// Additional utilities for type checking
export const isArrayOfType = <T>(
  arr: unknown, 
  typeCheck: (item: unknown) => item is T
): arr is T[] => {
  return Array.isArray(arr) && arr.every(item => typeCheck(item));
};
