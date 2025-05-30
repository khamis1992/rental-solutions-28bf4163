import { Database } from '@/types/database.types';

// Base Agreement type that matches the database schema exactly
export type Agreement = Database['public']['Tables']['leases']['Row'] & {
  // Relationship data
  customers?: Database['public']['Tables']['profiles']['Row'];
  profiles?: Database['public']['Tables']['profiles']['Row'];
  vehicles?: Database['public']['Tables']['vehicles']['Row'];
  
  // Computed/derived fields
  customer_name?: string;
  vehicle_info?: string;
  terms_accepted?: boolean;
  license_plate?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  next_payment_date?: string;
};

// Database operation types
export type AgreementInsert = Database['public']['Tables']['leases']['Insert'];
export type AgreementUpdate = Database['public']['Tables']['leases']['Update'];

// Status type from database enum
export type AgreementStatus = Database['public']['Tables']['leases']['Row']['status'];

// Filter parameters for agreement queries
export interface AgreementFilterParams {
  customerId?: string;
  vehicleId?: string;
  status?: AgreementStatus;
  startDate?: string;
  endDate?: string;
  agreementNumber?: string;
  agreementType?: Database['public']['Tables']['leases']['Row']['agreement_type'];
  searchTerm?: string;
}

// Helper function to ensure type safety when creating agreements
export function createAgreementData(data: Partial<Agreement>): AgreementInsert {
  // Extract only the fields that belong to the leases table insert type
  const {
    agreement_number,
    customer_id,
    vehicle_id,
    start_date,
    end_date,
    rent_amount,
    deposit_amount,
    down_payment,
    daily_late_fee,
    payment_frequency,
    payment_day,
    rent_due_day,
    status,
    agreement_type,
    notes,
    confirmation_email_sent
  } = data;

  return {
    agreement_number,
    customer_id,
    vehicle_id,
    start_date,
    end_date,
    rent_amount,
    deposit_amount,
    down_payment,
    daily_late_fee,
    payment_frequency,
    payment_day,
    rent_due_day,
    status,
    agreement_type,
    notes,
    confirmation_email_sent
  } as AgreementInsert;
}

// Helper function to validate agreement status
export function isValidAgreementStatus(status: string): status is AgreementStatus {
  const validStatuses = ['active', 'closed', 'cancelled', 'draft', 'pending', 'expired'] as const;
  return validStatuses.includes(status as AgreementStatus);
}

// Helper function to get display name for agreement type
export function getAgreementTypeDisplay(type: string | null): string {
  switch (type) {
    case 'short_term':
      return 'Short Term';
    case 'long_term':
      return 'Long Term';
    case 'lease_to_own':
      return 'Lease to Own';
    default:
      return 'Standard';
  }
}
