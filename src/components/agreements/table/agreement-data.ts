
import { SimpleAgreement } from '@/types/agreement-types';
import { Agreement } from '@/types/agreement';

export function processAgreementData(agreements: SimpleAgreement[]): Agreement[] {
  // Convert SimpleAgreement to Agreement with proper type conversions
  return agreements?.map((agreement: SimpleAgreement) => ({
    ...agreement,
    payment_frequency: agreement.payment_frequency || 'monthly', // Default value for type compatibility
    payment_day: agreement.payment_day || 1, // Default value for type compatibility
    customers: {
      full_name: agreement.customers?.full_name || agreement.customer_name || 'N/A',
      id: agreement.customers?.id || agreement.customer_id
    },
    // Convert string dates to Date objects
    start_date: agreement.start_date ? new Date(agreement.start_date) : new Date(),
    end_date: agreement.end_date ? new Date(agreement.end_date) : new Date(),
    created_at: agreement.created_at ? new Date(agreement.created_at) : undefined,
    updated_at: agreement.updated_at ? new Date(agreement.updated_at) : undefined
  })) as Agreement[];
}
