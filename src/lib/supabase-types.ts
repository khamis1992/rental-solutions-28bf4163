
import { Database } from '@/types/database.types';
import { asUUID, UUID } from '@/lib/uuid-helpers';
import { extractResponseData } from '@/lib/type-helpers';

type Tables = Database['public']['Tables'];

// Helper type for database IDs that enforces UUID format
export type DbId = UUID;

// Helper type for payment status that matches the database enum
export type PaymentStatus = Tables['unified_payments']['Row']['status'];

// Helper type for legal case status that matches the database enum
export type LegalCaseStatus = Tables['legal_cases']['Row']['status'];

// Helper type for vehicle status that matches the database enum
export type VehicleStatus = Tables['vehicles']['Row']['status'];

// Helper type for agreement status that matches the database enum
export type AgreementStatus = Tables['leases']['Row']['status'];

// Helper function to cast IDs to the correct type
export const castDbId = (id: string): DbId => asUUID(id);

// Helper function to cast payment status to the correct type
export const castPaymentStatus = (status: string): PaymentStatus => status as PaymentStatus;

// Helper function to cast legal case status to the correct type
export const castLegalCaseStatus = (status: string): LegalCaseStatus => status as LegalCaseStatus;

// Helper function to cast vehicle status to the correct type
export const castVehicleStatus = (status: string): VehicleStatus => status as VehicleStatus;

// Helper function to cast agreement status to the correct type 
export const castAgreementStatus = (status: string): AgreementStatus => status as AgreementStatus;

// Helper function to handle Supabase response errors
export const handleSupabaseResponse = <T>(response: any): T | null => {
  return extractResponseData<T>(response);
};
