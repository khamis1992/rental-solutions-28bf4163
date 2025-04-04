
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Agreement Status Enum
export const AgreementStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  DRAFT: 'draft',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  CLOSED: 'closed'
} as const;

// Define the Agreement schema
export const agreementSchema = z.object({
  id: z.string().uuid().optional(),
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  start_date: z.date(),
  end_date: z.date(),
  status: z.enum(['active', 'pending', 'draft', 'cancelled', 'expired', 'closed']),
  total_amount: z.number().nonnegative(),
  deposit_amount: z.number().nonnegative().optional(),
  rent_amount: z.number().nonnegative().optional(),
  daily_late_fee: z.number().nonnegative().optional(),
  agreement_number: z.string().optional(),
  notes: z.string().optional(),
  terms_accepted: z.boolean(),
  additional_drivers: z.array(z.string()).optional(),
});

// Export the type for use in components
export type Agreement = z.infer<typeof agreementSchema>;

// Function to generate a payment schedule for an agreement
export const forceGeneratePaymentForAgreement = async (
  supabaseClient: typeof supabase,
  agreementId: string,
  specificMonth?: Date
) => {
  try {
    // Check if the agreement exists
    const { data: agreement, error } = await supabaseClient
      .from('leases')
      .select('*')
      .eq('id', agreementId)
      .single();

    if (error) {
      console.error('Error fetching agreement:', error);
      return { success: false, message: `Failed to find agreement: ${error.message}` };
    }

    if (!agreement) {
      return { success: false, message: 'Agreement not found' };
    }

    // Generate payment data
    const paymentData = {
      lease_id: agreementId,
      amount: agreement.rent_amount || agreement.monthly_payment || 0,
      type: 'rent',
      description: 'Monthly rent payment',
      status: 'pending',
      payment_method: null,
      payment_date: null,
      due_date: specificMonth || new Date(),
      is_recurring: true,
      recurring_interval: '1 month'
    };

    // Create the payment record
    const { data: paymentRecord, error: paymentError } = await supabaseClient
      .from('unified_payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return { success: false, message: `Failed to create payment record: ${paymentError.message}` };
    }

    return { success: true, paymentId: paymentRecord.id };
  } catch (error) {
    console.error('Unexpected error in forceGeneratePaymentForAgreement:', error);
    return { success: false, message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` };
  }
};
