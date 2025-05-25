
import { supabase } from '@/lib/supabase';

export async function forceGeneratePaymentForAgreement(
  supabaseClient: any,
  agreementId: string
): Promise<{ success: boolean; message?: string }> {
  console.log('forceGeneratePaymentForAgreement called with:', agreementId);
  
  // Validate agreement ID
  if (!agreementId || agreementId === 'undefined' || agreementId.trim() === '') {
    console.error('Invalid agreement ID provided:', agreementId);
    return { success: false, message: 'Invalid agreement ID provided' };
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(agreementId)) {
    console.error('Invalid UUID format:', agreementId);
    return { success: false, message: `Invalid UUID format: ${agreementId}` };
  }

  try {
    // First check if agreement exists
    const { data: agreement, error: agreementError } = await supabaseClient
      .from('leases')
      .select('id, agreement_number, rent_amount, start_date, end_date, status')
      .eq('id', agreementId)
      .single();

    if (agreementError) {
      console.error('Error fetching agreement:', agreementError);
      return { success: false, message: `Agreement not found: ${agreementError.message}` };
    }

    if (!agreement) {
      console.error('Agreement not found with ID:', agreementId);
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
      .eq('lease_id', agreementId)
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
      lease_id: agreementId,
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
