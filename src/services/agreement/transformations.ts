
import { Agreement } from '@/types/agreement';
import { Database } from '@/types/database.types';
import { DbId, LeaseStatus } from '@/types/database-common';

export type DbAgreement = Database['public']['Tables']['leases']['Row'];

/**
 * Maps a database agreement record to the domain Agreement type
 * 
 * @param dbAgreement - Database agreement record
 * @returns Mapped Agreement object
 */
export function mapDbToAgreement(dbAgreement: DbAgreement): Agreement {
  return {
    id: dbAgreement.id,
    agreement_number: dbAgreement.agreement_number,
    customer_id: dbAgreement.customer_id as DbId,
    vehicle_id: dbAgreement.vehicle_id as DbId,
    status: dbAgreement.status as LeaseStatus,
    start_date: dbAgreement.start_date || '',
    end_date: dbAgreement.end_date || '',
    rent_amount: dbAgreement.rent_amount || 0,
    deposit_amount: dbAgreement.deposit_amount || 0,
    payment_frequency: dbAgreement.payment_frequency || 'monthly',
    payment_day: dbAgreement.rent_due_day || 1,
    total_amount: dbAgreement.total_amount || 0,
    notes: dbAgreement.notes || '',
    created_at: dbAgreement.created_at,
    updated_at: dbAgreement.updated_at,
    // Map nested objects if they exist in the database record
    customers: dbAgreement.customers ? {
      id: dbAgreement.customers.id,
      full_name: dbAgreement.customers.full_name,
      email: dbAgreement.customers.email,
      phone_number: dbAgreement.customers.phone_number
    } : undefined,
    vehicles: dbAgreement.vehicles ? {
      id: dbAgreement.vehicles.id,
      make: dbAgreement.vehicles.make,
      model: dbAgreement.vehicles.model,
      license_plate: dbAgreement.vehicles.license_plate,
      image_url: dbAgreement.vehicles.image_url,
      year: dbAgreement.vehicles.year,
      color: dbAgreement.vehicles.color
    } : undefined,
  };
}

/**
 * Validates an agreement for required fields
 * 
 * @param agreement - Agreement to validate
 * @returns Object containing validity and any error messages
 */
export function validateAgreement(agreement: Partial<Agreement>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  
  if (!agreement.customer_id) {
    errors.customer_id = 'Customer is required';
  }
  
  if (!agreement.vehicle_id) {
    errors.vehicle_id = 'Vehicle is required';
  }
  
  if (!agreement.start_date) {
    errors.start_date = 'Start date is required';
  }
  
  if (!agreement.end_date) {
    errors.end_date = 'End date is required';
  }
  
  if (agreement.rent_amount === undefined || agreement.rent_amount <= 0) {
    errors.rent_amount = 'Rent amount must be greater than zero';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
