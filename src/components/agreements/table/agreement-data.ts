
import { SimpleAgreement } from '@/hooks/use-agreements';
import { Agreement } from '@/types/agreement';

export function processAgreementData(agreements: SimpleAgreement[]): Agreement[] {
  // Convert SimpleAgreement to Agreement with proper type conversions
  return agreements?.map((agreement: SimpleAgreement) => ({
    ...agreement,
    payment_frequency: agreement.payment_frequency || 'monthly',
    // Map rent_due_day to payment_day for backwards compatibility
    payment_day: agreement.rent_due_day || 1,
    rent_due_day: agreement.rent_due_day || 1,
    customers: {
      full_name: agreement.customers?.full_name || agreement.customer_name || 'N/A',
      id: agreement.customers?.id || agreement.customer_id
    },
    // Ensure proper date handling with safe conversion
    start_date: agreement.start_date 
      ? (typeof agreement.start_date === 'string' ? agreement.start_date : new Date(agreement.start_date).toISOString()) 
      : new Date().toISOString(),
    end_date: agreement.end_date 
      ? (typeof agreement.end_date === 'string' ? agreement.end_date : new Date(agreement.end_date).toISOString()) 
      : new Date().toISOString(),
    created_at: agreement.created_at 
      ? (typeof agreement.created_at === 'string' ? agreement.created_at : new Date(agreement.created_at).toISOString()) 
      : undefined,
    updated_at: agreement.updated_at 
      ? (typeof agreement.updated_at === 'string' ? agreement.updated_at : new Date(agreement.updated_at).toISOString()) 
      : undefined
  })) as Agreement[];
}
