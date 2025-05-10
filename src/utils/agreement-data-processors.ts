
import { Agreement } from '@/types/agreement';
import { CustomerInfo } from '@/types/customer';
import { LeaseStatus } from '@/types/lease-types';
import { ensureValidLeaseStatus } from '@/utils/type-safety';

/**
 * Helper function to ensure dates are properly handled
 */
export const ensureDate = (dateValue: string | Date | undefined): Date | undefined => {
  if (!dateValue) return undefined;
  return dateValue instanceof Date ? dateValue : new Date(dateValue);
};

/**
 * Helper to safely process fetched agreement data
 */
export const processAgreementData = (data: any): Agreement | null => {
  if (!data) return null;
  
  try {
    // Check if we have the necessary data
    if (!data.id) return null;
    
    console.log("Processing agreement data:", data);
    
    const processedAgreement: Agreement = {
      id: data.id,
      status: ensureValidLeaseStatus(data.status),
      customer_id: data.customer_id || '',
      vehicle_id: data.vehicle_id || '',
      start_date: ensureDate(data.start_date) || new Date(),
      end_date: ensureDate(data.end_date) || new Date(),
      total_amount: data.total_amount || 0,
      created_at: data.created_at ? ensureDate(data.created_at) : undefined,
      updated_at: data.updated_at ? ensureDate(data.updated_at) : undefined,
      customers: data.customers || data.profiles || {},
      vehicles: data.vehicles || {},
      rent_amount: data.rent_amount || 0,
      agreement_number: data.agreement_number,
      agreement_type: data.agreement_type,
      notes: data.notes,
      payment_frequency: data.payment_frequency,
      payment_day: data.payment_day,
      daily_late_fee: data.daily_late_fee,
      deposit_amount: data.deposit_amount,
      remaining_amount: data.remaining_amount,
      next_payment_date: data.next_payment_date,
      last_payment_date: data.last_payment_date,
      vehicle_make: data.vehicles?.make,
      vehicle_model: data.vehicles?.model,
      license_plate: data.vehicles?.license_plate,
    };
    
    return processedAgreement;
  } catch (error) {
    console.error("Error processing agreement data:", error);
    return null;
  }
};

/**
 * Helper to convert profile/customers data to CustomerInfo
 */
export const processCustomerData = (data: any): CustomerInfo | null => {
  if (!data) return null;
  
  try {
    return {
      id: data.id || '',
      full_name: data.full_name || '',
      email: data.email || '',
      phone_number: data.phone_number || '',
      driver_license: data.driver_license || '',
      nationality: data.nationality || '',
      address: data.address || ''
    };
  } catch (error) {
    console.error("Error processing customer data:", error);
    return null;
  }
};
