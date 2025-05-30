import { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { Result, SuccessResult, ErrorResult } from './error.types';

/**
 * Type for a single item Supabase response
 */
export type SupabaseSingleResponse<T> = Result<T>;

/**
 * Type for an array of items Supabase response
 */
export type SupabaseArrayResponse<T> = Result<T[]>;

/**
 * Type guard to check if a response is a single item response
 */
export function isSingleResponse<T>(response: PostgrestResponse<T> | PostgrestSingleResponse<T>): response is PostgrestSingleResponse<T> {
  return !Array.isArray(response.data);
}

/**
 * Type guard to check if a response is an array response
 */
export function isArrayResponse<T>(response: PostgrestResponse<T> | PostgrestSingleResponse<T>): response is PostgrestResponse<T> {
  return Array.isArray(response.data);
}

/**
 * Type guard to check if a response has valid data
 */
export function hasValidData<T>(response: PostgrestResponse<T> | PostgrestSingleResponse<T> | null | undefined): response is { data: NonNullable<T>; error: null } {
  return Boolean(response && !response.error && response.data);
}

/**
 * Type guard to check if a response is an error
 */
export function isError<T>(response: PostgrestResponse<T> | PostgrestSingleResponse<T>): response is { error: PostgrestError; data: null } {
  return Boolean(response.error);
}

/**
 * Helper type to extract the data type from a Supabase response
 */
export type ExtractData<T> = T extends PostgrestResponse<infer U> | PostgrestSingleResponse<infer U> ? U : never;

/**
 * Helper type to create a typed Supabase response
 */
export type TypedSupabaseResponse<T> = {
  data: T | null;
  error: PostgrestError | null;
  count: number | null;
  status: number;
  statusText: string;
};

/**
 * Helper type to create a typed Supabase array response
 */
export type TypedSupabaseArrayResponse<T> = {
  data: T[] | null;
  error: PostgrestError | null;
  count: number | null;
  status: number;
  statusText: string;
};

/**
 * Helper type to create a typed Supabase single response
 */
export type TypedSupabaseSingleResponse<T> = {
  data: T | null;
  error: PostgrestError | null;
  count: number | null;
  status: number;
  statusText: string;
};

/**
 * Helper type to convert a Supabase response to a Result type
 */
export type ToResult<T> = T extends any[] ? Result<T[number]> : Result<T>;

/**
 * Helper type to convert a Supabase response to a Result array type
 */
export type ToResultArray<T> = Result<T[]>;

/**
 * Helper type to convert a Supabase response to a Result single type
 */
export type ToResultSingle<T> = Result<T>; 