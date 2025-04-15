
/**
 * Database helpers and utilities for Supabase
 */
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/postgrest-js';
import { Database } from '@/types/database.types';
import { DbTables, SchemaName } from '@/types/database-types';

// Create a common type for Database IDs
export type DatabaseId = string;

/**
 * Type-safe UUID type
 */
export type UUID = string;

/**
 * Safe type checking function for database responses
 */
export function isSuccessfulResponse<T>(response: any): response is { data: T, error: null } {
  return !response.error && response.data !== null && response.data !== undefined;
}

/**
 * Helper for ensuring all row typings match database schema 
 */
export type TableRow<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

/**
 * Helper for creating insert values
 */
export type TableInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

/**
 * Helper for creating update values
 */
export type TableUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

/**
 * Safely cast a database ID to the correct type
 */
export function castDbId<T extends string>(id: string): T {
  return id as T;
}

/**
 * Type guard to check if a response has data and is not an error
 */
export function hasData<T>(
  response: PostgrestSingleResponse<T> | PostgrestResponse<T> | null | undefined
): response is { data: NonNullable<T>; error: null } {
  return Boolean(response && !response.error && response.data !== null && response.data !== undefined);
}

/**
 * Safely extract data from a Supabase response
 */
export function safelyExtractData(response: any): any {
  if (!response) return null;
  return response.data || null;
}

/**
 * Safely handle a database response with error checking
 */
export function handleDatabaseResponse<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): T | null {
  if (response?.error) {
    console.error('Database error:', response.error);
    return null;
  }
  return response?.data || null;
}

// Simple ID casts that work around complex type issues by using basic type assertions
// These functions safely cast string IDs to the required database ID types
export function asTableId(_table: string, id: string): any { return id; }
export function asAgreementId(id: string): any { return id; }
export function asLeaseId(id: string): any { return id; }
export function asLeaseIdColumn(id: string): any { return id; }
export function asVehicleId(id: string): any { return id; }
export function asAgreementIdColumn(id: string): any { return id; }
export function asImportIdColumn(id: string): any { return id; }
export function asImportId(id: string): any { return id; }
export function asTrafficFineIdColumn(id: string): any { return id; }
export function asTrafficFineId(id: string): any { return id; }
export function asPaymentId(id: string): any { return id; }
export function asCustomerId(id: string): any { return id; }
export function asProfileId(id: string): any { return id; }
export function asMaintenanceId(id: string): any { return id; }
export function asDocumentId(id: string): any { return id; }
export function asTemplateId(id: string): any { return id; }
export function asCategoryId(id: string): any { return id; }
export function asLegalCaseId(id: string): any { return id; }

// Status columns 
export function asStatusColumn(status: string): any { return status; }
export function asPaymentStatusColumn(status: string): any { return status; }

/**
 * Helper for checking response and safely handling error cases
 */
export function getResponseData<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): T | null {
  if (!hasData(response)) {
    return null;
  }
  return response.data;
}

// Type assertion helper to safely cast any query response
export function castQueryResponse<T>(data: any): T {
  return data as T;
}
