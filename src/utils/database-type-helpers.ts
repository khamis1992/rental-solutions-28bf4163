
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

// These helpers are simplified to avoid strong typing issues
// These functions accept any string and cast them appropriately for database operations

/**
 * Simple string cast for table id columns - handles all ID column types
 */
export function asTableId(table: string, id: string): string {
  return id;
}

// Simplified helper functions for various ID columns
export function asAgreementId(id: string): string { return id; }
export function asLeaseId(id: string): string { return id; }
export function asLeaseIdColumn(id: string): string { return id; }
export function asVehicleId(id: string): string { return id; }
export function asAgreementIdColumn(id: string): string { return id; }
export function asImportIdColumn(id: string): string { return id; }
export function asImportId(id: string): string { return id; }
export function asTrafficFineIdColumn(id: string): string { return id; }
export function asTrafficFineId(id: string): string { return id; }
export function asPaymentId(id: string): string { return id; }
export function asCustomerId(id: string): string { return id; }
export function asProfileId(id: string): string { return id; }
export function asMaintenanceId(id: string): string { return id; }
export function asDocumentId(id: string): string { return id; }
export function asTemplateId(id: string): string { return id; }
export function asCategoryId(id: string): string { return id; }
export function asLegalCaseId(id: string): string { return id; }

// Simple string cast for status columns
export function asStatusColumn(status: string): string { return status; }
export function asPaymentStatusColumn(status: string): string { return status; }

/**
 * Helper for checking response and safely handling error cases
 */
export function getResponseData<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): T | null {
  if (!hasData(response)) {
    return null;
  }
  return response.data;
}
