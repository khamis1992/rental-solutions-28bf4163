
import { Agreement } from '@/lib/validation-schemas/agreement';

/**
 * Calculates the late fee based on the rent amount and days late
 * @param rentAmount The amount of rent
 * @param daysLate Number of days the payment is late
 * @returns The calculated late fee
 */
export function calculateLateFee(rentAmount: number, daysLate: number): number {
  // Base late fee is 10% of rent amount
  const baseFee = rentAmount * 0.1;
  
  // Additional fee per day is 2% of rent up to 10 days max
  const dailyFee = rentAmount * 0.02 * Math.min(daysLate, 10);
  
  // Cap the total late fee at 30% of rent
  return Math.min(baseFee + dailyFee, rentAmount * 0.3);
}

/**
 * Updates an agreement with validation checks
 */
export function updateAgreementWithCheck(agreement: Agreement): Promise<boolean> {
  // Implementation would go here
  return Promise.resolve(true);
}

/**
 * Adapts a simple agreement object to a full agreement object
 */
export function adaptSimpleToFullAgreement(data: any): Agreement {
  const agreement: Agreement = {
    ...data,
    start_date: data.start_date ? new Date(data.start_date) : null,
    end_date: data.end_date ? new Date(data.end_date) : null,
    created_at: data.created_at ? new Date(data.created_at) : null,
    updated_at: data.updated_at ? new Date(data.updated_at) : null,
  };
  
  return agreement;
}
