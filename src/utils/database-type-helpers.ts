
import { Database } from '@/types/database.types';

// Define useful types for database operations
type Tables = Database['public']['Tables'];
type SchemaName = keyof Database;

// Function to safely extract fields from database objects
export function safelyExtractFields<T extends object>(
  data: any | null | undefined,
  defaults: T,
  requiredFields: string[] = []
): T {
  if (!data) return defaults;
  
  // Create a new object with default values
  const result = { ...defaults };
  
  // Copy over all available fields from data
  Object.keys(defaults).forEach(key => {
    if (key in data && data[key] !== null && data[key] !== undefined) {
      (result as any)[key] = data[key];
    }
  });
  
  // Check if all required fields are available
  const missingFields = requiredFields.filter(field => 
    !(field in data) || data[field] === null || data[field] === undefined
  );
  
  if (missingFields.length > 0) {
    console.warn(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  return result;
}

// Type-safe ID helpers for the database
export function asVehicleId(id: string): Tables['vehicles']['Row']['id'] {
  return id as Tables['vehicles']['Row']['id'];
}

export function asLeaseId(id: string): Tables['leases']['Row']['id'] {
  return id as Tables['leases']['Row']['id'];
}

export function asPaymentId(id: string): Tables['unified_payments']['Row']['id'] {
  return id as Tables['unified_payments']['Row']['id'];
}

export function asProfileId(id: string): Tables['profiles']['Row']['id'] {
  return id as Tables['profiles']['Row']['id'];
}

export function asImportId(id: string): string {
  return id as string;
}

// Cast row data safely with proper typing
export function castRowData<T>(data: any): T {
  return data as T;
}

// Generic function to cast a string ID to any database table ID type
export function castDbId<T extends keyof Tables>(id: string, table?: T): Tables[T extends keyof Tables ? T : 'leases']['Row']['id'] {
  return id as any;
}

// Generic function to cast a string ID to any database table ID type
export function castDatabaseId<T extends keyof Tables>(id: string): Tables[T]['Row']['id'] {
  return id as Tables[T]['Row']['id'];
}

// Type-safe status helpers
export function asLeaseStatus(status: string): Tables['leases']['Row']['status'] {
  return status as Tables['leases']['Row']['status'];
}

export function asPaymentStatus(status: string): Tables['unified_payments']['Row']['status'] {
  return status as Tables['unified_payments']['Row']['status'];
}

// Type-safe update helpers - converts partial objects into properly typed update objects
export function castLeaseStatus(status: string): Tables['leases']['Row']['status'] {
  return status as Tables['leases']['Row']['status']; 
}

export function castLeaseUpdate(updates: Partial<Tables['leases']['Update']>): Tables['leases']['Update'] {
  return updates as Tables['leases']['Update'];
}

export function castPaymentUpdate(updates: Partial<Tables['unified_payments']['Update']>): Tables['unified_payments']['Update'] {
  return updates as Tables['unified_payments']['Update'];
}

export function castProfileUpdate(updates: Partial<Tables['profiles']['Update']>): Tables['profiles']['Update'] {
  return updates as Tables['profiles']['Update'];
}

// Type guard for checking Supabase response validity
export function hasData<T>(response: { data: T | null, error: any }): response is { data: T, error: null } {
  return response !== null && response.error === null && response.data !== null;
}

// Function to safely handle Supabase responses
export function safelyGetData<T>(response: { data: T | null, error: any }): T | null {
  if (!response || response.error || !response.data) {
    return null;
  }
  return response.data;
}

// RPC function return types
export interface DeleteAgreementsByImportIdResult {
  success: boolean;
  deleted_count: number;
  message?: string;
}

export interface RevertAgreementImportResult {
  success: boolean;
  deleted_count: number;
  message?: string;
}

export interface GenerateAgreementDocumentResult {
  success: boolean;
  document_url?: string;
  message?: string;
}

// Type-safe casting functions for RPC results
export function castDeleteAgreementsResult(result: unknown): DeleteAgreementsByImportIdResult {
  return result as DeleteAgreementsByImportIdResult;
}

export function castRevertAgreementImportResult(result: unknown): RevertAgreementImportResult {
  return result as RevertAgreementImportResult;
}

export function castGenerateAgreementDocumentResult(result: unknown): GenerateAgreementDocumentResult {
  return result as GenerateAgreementDocumentResult;
}

// Utility to help with database operations that need unified payment lease ID
export function castUnifiedPaymentLeaseId(id: string): Tables['unified_payments']['Row']['lease_id'] {
  return id as Tables['unified_payments']['Row']['lease_id'];
}
