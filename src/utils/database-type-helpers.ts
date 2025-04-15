
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
  // Safely extracts data from a Supabase response
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

// Column-specific helper functions for type-safe database operations

/**
 * Ensures that a string ID is treated as a valid agreement_id in database queries 
 */
export function asAgreementIdColumn(id: string): string {
  return id;
}

/**
 * Ensures that a string ID is treated as a valid lease_id in database queries
 */
export function asLeaseIdColumn(id: string): string {
  return id;
}

/**
 * Ensures that a string ID is treated as a valid lease ID in database queries
 */
export function asLeaseId(id: string): string {
  return id;
}

/**
 * Ensures that a string ID is treated as a valid import_id in database queries
 */
export function asImportIdColumn(id: string): string {
  return id;
}

/**
 * Ensures that a string ID is treated as a valid traffic_fine_id in database queries
 */
export function asTrafficFineIdColumn(id: string): string {
  return id;
}

/**
 * Ensures that a string ID is treated as a valid vehicle_id in database queries
 */
export function asVehicleId(id: string): string {
  return id;
}

/**
 * Ensures that a string ID is treated as a valid payment_id in database queries
 */
export function asPaymentId(id: string): string {
  return id;
}

/**
 * Ensures that a string ID is treated as a valid table ID in database queries
 */
export function asTableId(table: string, id: string): string {
  return id;
}

/**
 * Ensures that a string status is treated as a valid status column in database queries
 */
export function asStatusColumn(status: string): string {
  return status;
}

/**
 * Ensures that a string payment status is treated as a valid payment_status column in database queries
 */
export function asPaymentStatusColumn(status: string): string {
  return status;
}

/**
 * Helper for checking response and safely handling error cases
 */
export function getResponseData<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): T | null {
  if (!hasData(response)) {
    return null;
  }
  return response.data;
}
