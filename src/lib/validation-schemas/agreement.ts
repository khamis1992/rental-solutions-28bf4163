
import { z } from 'zod';

export const agreementSchema = z.object({
  id: z.string().optional(),
  customer_id: z.string(),
  vehicle_id: z.string(),
  agreement_number: z.string().optional(),
  start_date: z.date(),
  end_date: z.date(),
  rent_amount: z.number(),
  contract_amount: z.number(),
  deposit_amount: z.number().optional().nullable(),
  daily_late_fee: z.number().optional().nullable(),
  agreement_type: z.enum(['short_term', 'long_term', 'rental', 'lease_to_own']),
  agreement_duration: z.string().optional(),
  rent_due_day: z.number().optional().nullable(),
  due_date: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['active', 'pending', 'draft', 'completed', 'cancelled', 'pending_payment', 'pending_deposit', 'expired', 'terminated', 'archived', 'closed']).optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  last_payment_date: z.date().optional().nullable(),
  terms_accepted: z.boolean().optional().default(false),
  total_amount: z.number().optional(),
  
  // Related entities
  customer_name: z.string().optional(),
  customer_email: z.string().optional().nullable(),
  customer_phone: z.string().optional().nullable(),
  vehicles: z.object({
    make: z.string(),
    model: z.string(),
    license_plate: z.string(),
    year: z.number().optional()
  }).optional().nullable(),
  customers: z.object({
    id: z.string(),
    full_name: z.string(),
    phone_number: z.string().optional().nullable(),
    email: z.string().optional().nullable()
  }).optional().nullable()
});

export type Agreement = z.infer<typeof agreementSchema>;

export enum AgreementStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  DRAFT = 'draft',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PENDING_PAYMENT = 'pending_payment',
  PENDING_DEPOSIT = 'pending_deposit',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  ARCHIVED = 'archived',
  CLOSED = 'closed'
}

/**
 * Force generates a payment for the specified agreement
 * @param supabase The Supabase client
 * @param agreementId The ID of the agreement to generate payments for
 * @returns Result object with success status and optional message
 */
export async function forceGeneratePaymentForAgreement(supabase: any, agreementId: string) {
  if (!agreementId) {
    return { success: false, message: 'Agreement ID is required' };
  }
  
  try {
    // Fetch the agreement details
    const { data: agreement, error: agreementError } = await supabase
      .from('leases')
      .select('*, profiles:customer_id(*)')
      .eq('id', agreementId)
      .single();
    
    if (agreementError || !agreement) {
      return { 
        success: false, 
        message: `Failed to fetch agreement: ${agreementError?.message || 'Agreement not found'}` 
      };
    }
    
    // Calculate payment due date - default to first day of next month
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const dueDate = agreement.rent_due_day 
      ? new Date(today.getFullYear(), today.getMonth() + 1, agreement.rent_due_day)
      : nextMonth;
    
    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('unified_payments')
      .insert({
        lease_id: agreementId,
        amount: agreement.rent_amount || 0,
        due_date: dueDate.toISOString(),
        original_due_date: dueDate.toISOString(),
        status: 'pending',
        description: `Rent payment for ${agreement.agreement_number || 'agreement'}`,
        is_recurring: false,
        amount_paid: 0,
        balance: agreement.rent_amount || 0
      })
      .select()
      .single();
      
    if (paymentError) {
      return { 
        success: false, 
        message: `Failed to generate payment: ${paymentError.message}` 
      };
    }
    
    return { 
      success: true, 
      message: 'Payment generated successfully',
      payment 
    };
  } catch (error) {
    console.error("Error in forceGeneratePaymentForAgreement:", error);
    return { 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}
