
import { supabase } from '@/lib/supabase';
import { isValidUUID, validateUUID } from '@/lib/uuid-validation';

// Define the Agreement type
export interface Agreement {
  id: string;
  agreement_number: string;
  customer_id: string;
  vehicle_id: string;
  start_date: string | Date;
  end_date: string | Date;
  rent_amount: number;
  total_amount: number;
  status: AgreementStatus;
  created_at: string | Date;
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
  // Related data that might be included in joins
  customers?: any;
  profiles?: any;
  vehicles?: any;
}

// Define agreement status enum
export type AgreementStatus = 'draft' | 'active' | 'pending' | 'closed' | 'cancelled' | 'expired';

// Agreement validation schema
export const agreementSchema = {
  agreement_number: {
    required: true,
    type: 'string',
    minLength: 1
  },
  customer_id: {
    required: true,
    type: 'string',
    validate: (value: string) => isValidUUID(value)
  },
  vehicle_id: {
    required: true,
    type: 'string',
    validate: (value: string) => isValidUUID(value)
  },
  start_date: {
    required: true,
    type: 'date'
  },
  end_date: {
    required: true,
    type: 'date'
  },
  rent_amount: {
    required: true,
    type: 'number',
    min: 0
  },
  status: {
    required: true,
    type: 'string',
    enum: ['draft', 'active', 'pending', 'closed', 'cancelled', 'expired']
  }
};

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
