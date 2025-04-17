
import { Database } from '@/types/database.types';
import { supabase } from '@/lib/supabase';

// Type-safe ID column functions
export function asLeaseId(id: string) {
  return id as string;
}

export function asVehicleId(id: string) {
  return id as string;
}

export function asAgreementId(id: string) {
  return id as string;
}

export function asPaymentId(id: string) {
  return id as string;
}

export function asImportId(id: string) {
  return id as string;
}

// Column-specific type casters
export function asLeaseIdColumn(id: string) {
  return id as any;  // Using any to ensure compatibility with strict Supabase types
}

export function asAgreementIdColumn(id: string) {
  return id as any;  // Using any to ensure compatibility with strict Supabase types
}

export function asVehicleIdColumn(id: string) {
  return id as any;  // Using any to ensure compatibility with strict Supabase types
}

export function asImportIdColumn(id: string) {
  return id as any;  // Using any to ensure compatibility with strict Supabase types
}

// Enhanced safety for status and API responses
export function asStatusColumn(status: string) {
  return status as string;
}

// Fix: Add asPaymentStatusColumn which was missing
export function asPaymentStatusColumn(status: string) {
  return status as string;
}

export function safelyExtractData<T>(result: any): T | null {
  if (!result || result.error || !result.data) {
    return null;
  }
  return result.data as T;
}

// Checks if a response has data
export function hasData(response: any) {
  return response && !response.error && response.data !== null;
}

// Safe data access for nested properties
export function safelyGetValue<T, K extends keyof T>(obj: T | null | undefined, key: K, defaultValue?: T[K]): T[K] | undefined {
  if (!obj) return defaultValue;
  return obj[key] ?? defaultValue;
}

// Type-safety wrapper for Supabase queries
export async function safeQuery<T>(queryFn: () => Promise<any>): Promise<T | null> {
  try {
    const response = await queryFn();
    if (response.error) {
      console.error("Query error:", response.error);
      return null;
    }
    return response.data as T;
  } catch (error) {
    console.error("Exception in query:", error);
    return null;
  }
}

// Helper to safely handle profiles data in query responses
export function safelyGetProfileNames(profiles: any[] | undefined | null): string {
  if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
    return 'Unknown';
  }
  
  try {
    // Handle both single object and array formats
    if (profiles.length === 1) {
      return profiles[0]?.full_name || 'Unnamed';
    } else {
      return profiles.map(profile => profile?.full_name || 'Unnamed').join(', ');
    }
  } catch (error) {
    console.error('Error extracting profile names:', error);
    return 'Error';
  }
}

// Type converters for database IDs - helps with TypeScript errors
export function asDbId(id: string): any {
  return id;
}
