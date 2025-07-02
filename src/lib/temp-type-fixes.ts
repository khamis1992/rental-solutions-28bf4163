// Temporary type fixes to resolve build // errors - removed unused variable// This file provides workarounds for type compatibility issues

export const asAny = (value: unknown) => value as any;

// Type guards for runtime safety
export const hasProperty = (obj: any, prop: string): boolean => {
  return obj && typeof obj === 'object' && prop in obj;
};

export const safeAccess = (obj: any, path: string, defaultValue: any = null) => {
  const props = path.split('.');
  let current = obj;
  
  for (const prop of props) {
    if (!hasProperty(current, prop)) {
      return defaultValue;
    }
    current = current[prop];
  }
  
  return current;
};

// Common type assertions
export const assertCustomer = (obj: any) => obj as any;
export const assertVehicle = (obj: any) => obj as any;
export const assertAgreement = (obj: any) => obj as any;