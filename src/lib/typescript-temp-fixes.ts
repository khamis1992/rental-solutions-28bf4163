// Temporary TypeScript utility types to fix build errors
// This file provides type utilities to resolve compatibility issues

export type AnyObject = Record<string, any>;

// Simplified types for problematic components
export interface SimpleCustomer {
  id: string;
  full_name: string;
  email?: string | null;
  phone_number?: string | null;
  [key: string]: any;
}

export interface SimpleVehicle {
  id: string;
  make?: string | null;
  model?: string | null;
  license_plate?: string | null;
  year?: number | null;
  status?: string | null;
  [key: string]: any;
}

// Type assertion helpers
export const asAny = (value: unknown) => value as any;
export const asString = (value: unknown) => value as string;
export const asObject = (value: unknown) => value as AnyObject;

// Safe property access
export const safeGet = (obj: any, key: string, defaultValue: any = null) => {
  return obj?.[key] ?? defaultValue;
};