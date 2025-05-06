
/**
 * Type validation utility functions
 */

// Utility function to validate JSON string
export const isValidJSONString = (str: string): boolean => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

// Utility function to validate array
export const isValidArray = (arr: any): boolean => {
  return Array.isArray(arr);
};

// Utility function to validate object
export const isValidObject = (obj: any): boolean => {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
};

// Utility function to validate boolean
export const isValidBoolean = (bool: any): boolean => {
  return typeof bool === 'boolean';
};

// Utility function to validate null or undefined
export const isNullOrUndefined = (value: any): boolean => {
  return value === null || value === undefined;
};

// Utility function to validate empty array
export const isEmptyArray = (arr: any): boolean => {
  return Array.isArray(arr) && arr.length === 0;
};

// Utility function to validate empty object
export const isEmptyObject = (obj: any): boolean => {
  return typeof obj === 'object' && obj !== null && Object.keys(obj).length === 0;
};
