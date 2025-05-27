
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { isValidUUID, validateUUID } from '@/lib/uuid-validation';

// Define agreement status enum
export type AgreementStatus = 'draft' | 'active' | 'pending' | 'closed' | 'cancelled' | 'expired';

// Define the Agreement type with terms_accepted
export interface Agreement {
  id?: string;
  agreement_number: string;
  customer_id: string;
  vehicle_id: string;
  start_date: string | Date;
  end_date: string | Date;
  rent_amount: number;
  total_amount: number;
  status: AgreementStatus;
  created_at?: string | Date;
  updated_at?: string | Date;
  daily_late_fee?: number;
  rent_due_day?: number;
  agreement_duration?: string;
  lease_duration?: string;
  initial_mileage?: number;
  agreement_type?: string;
  notes?: string;
  template_id?: string;
  processed_content?: string;
  terms_accepted?: boolean;
  deposit_amount?: number;
  additional_drivers?: string[];
  // Related data that might be included in joins
  customers?: any;
  profiles?: any;
  vehicles?: any;
}

// Create a proper Zod schema for validation
export const agreementSchema = z.object({
  id: z.string().optional(),
  agreement_number: z.string().min(1, "Agreement number is required"),
  customer_id: z.string().refine((val) => isValidUUID(val), {
    message: "Invalid customer ID format"
  }),
  vehicle_id: z.string().refine((val) => isValidUUID(val), {
    message: "Invalid vehicle ID format"
  }),
  start_date: z.union([z.string(), z.date()]),
  end_date: z.union([z.string(), z.date()]),
  rent_amount: z.number().min(0, "Rent amount must be positive"),
  total_amount: z.number().min(0, "Total amount must be positive"),
  status: z.enum(['draft', 'active', 'pending', 'closed', 'cancelled', 'expired']),
  daily_late_fee: z.number().optional(),
  rent_due_day: z.number().optional(),
  agreement_duration: z.string().optional(),
  lease_duration: z.string().optional(),
  initial_mileage: z.number().optional(),
  agreement_type: z.string().optional(),
  notes: z.string().optional(),
  template_id: z.string().optional(),
  processed_content: z.string().optional(),
  terms_accepted: z.boolean().optional(),
  deposit_amount: z.number().optional(),
  additional_drivers: z.array(z.string()).optional(),
  created_at: z.union([z.string(), z.date()]).optional(),
  updated_at: z.union([z.string(), z.date()]).optional(),
  customers: z.any().optional(),
  profiles: z.any().optional(),
  vehicles: z.any().optional(),
});

// Agreement status values as constants for use in components
export const AGREEMENT_STATUS_VALUES = {
  DRAFT: 'draft' as const,
  ACTIVE: 'active' as const,
  PENDING: 'pending' as const,
  CLOSED: 'closed' as const,
  CANCELLED: 'cancelled' as const,
  EXPIRED: 'expired' as const,
};

export const AGREEMENT_STATUS_OPTIONS = [
  { value: AGREEMENT_STATUS_VALUES.DRAFT, label: 'Draft' },
  { value: AGREEMENT_STATUS_VALUES.ACTIVE, label: 'Active' },
  { value: AGREEMENT_STATUS_VALUES.PENDING, label: 'Pending' },
  { value: AGREEMENT_STATUS_VALUES.CLOSED, label: 'Closed' },
  { value: AGREEMENT_STATUS_VALUES.CANCELLED, label: 'Cancelled' },
  { value: AGREEMENT_STATUS_VALUES.EXPIRED, label: 'Expired' },
];

export async function forceGeneratePaymentForAgreement(
  supabaseClient: any,
  agreementId: string
): Promise<{ success: boolean; message?: string }> {
  console.log('forceGeneratePaymentForAgreement called with:', agreementId);
  
  // Validate agreement ID with comprehensive checks
  if (!agreementId || typeof agreementId !== 'string') {
    console.error('Invalid agreement ID provided (not a string):', agreementId);
    return { success: false, message: 'Agreement ID must be a valid string' };
  }

  // Check for common invalid values
  if (agreementId === 'undefined' || agreementId === 'null' || agreementId.trim() === '') {
    console.error('Invalid agreement ID provided (undefined/null/empty):', agreementId);
    return { success: false, message: 'Agreement ID cannot be undefined, null, or empty' };
  }

  // Validate UUID format
  if (!isValidUUID(agreementId)) {
    console.error('Invalid UUID format:', agreementId);
    return { success: false, message: `Invalid UUID format: ${agreementId}` };
  }

  try {
    // Validate the UUID one more time before database query
    const validatedId = validateUUID(agreementId, 'Agreement ID');
    
    // First check if agreement exists
    const { data: agreement, error: agreementError } = await supabaseClient
      .from('leases')
      .select('id, agreement_number, rent_amount, start_date, end_date, status')
      .eq('id', validatedId)
      .single();

    if (agreementError) {
      console.error('Error fetching agreement:', agreementError);
      return { success: false, message: `Agreement not found: ${agreementError.message}` };
    }

    if (!agreement) {
      console.error('Agreement not found with ID:', validatedId);
      return { success: false, message: 'Agreement not found' };
    }

    console.log('Agreement found:', agreement);

    // Check if agreement has required data for payment generation
    if (!agreement.rent_amount || agreement.rent_amount <= 0) {
      return { success: false, message: 'Agreement must have a valid rent amount to generate payments' };
    }

    if (!agreement.start_date) {
      return { success: false, message: 'Agreement must have a start date to generate payments' };
    }

    // Check if payments already exist for this agreement
    const { data: existingPayments, error: paymentsError } = await supabaseClient
      .from('unified_payments')
      .select('id')
      .eq('lease_id', validatedId)
      .limit(1);

    if (paymentsError) {
      console.error('Error checking existing payments:', paymentsError);
      return { success: false, message: `Error checking existing payments: ${paymentsError.message}` };
    }

    if (existingPayments && existingPayments.length > 0) {
      console.log('Payments already exist for this agreement');
      return { success: true, message: 'Payment schedule already exists for this agreement' };
    }

    // Generate first payment record
    const startDate = new Date(agreement.start_date);
    const firstPaymentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    // If start date is after the 1st, move to next month
    if (startDate.getDate() > 1) {
      firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
    }

    const paymentData = {
      lease_id: validatedId,
      amount: agreement.rent_amount,
      due_date: firstPaymentDate.toISOString(),
      description: `Monthly rent - ${firstPaymentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      type: 'Income',
      status: 'pending',
      is_recurring: false
    };

    console.log('Creating payment record:', paymentData);

    const { data: newPayment, error: insertError } = await supabaseClient
      .from('unified_payments')
      .insert([paymentData])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating payment record:', insertError);
      return { success: false, message: `Failed to create payment record: ${insertError.message}` };
    }

    console.log('Payment record created successfully:', newPayment);
    
    return { 
      success: true, 
      message: `Payment schedule generated successfully for agreement ${agreement.agreement_number}` 
    };

  } catch (error) {
    console.error('Unexpected error in forceGeneratePaymentForAgreement:', error);
    return { 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}
