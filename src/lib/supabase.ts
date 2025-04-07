
import { supabase } from '@/integrations/supabase/client';

// Function to fix agreement payments
export const fixAgreementPayments = async (agreementId: string) => {
  try {
    // Get the agreement details first
    const { data: agreement, error: agreementError } = await supabase
      .from('leases')
      .select('id, rent_amount, start_date')
      .eq('id', agreementId)
      .single();
      
    if (agreementError) {
      console.error('Error fetching agreement:', agreementError);
      return { 
        success: false, 
        error: `Could not fetch agreement: ${agreementError.message}`,
        generatedCount: 0
      };
    }
    
    // Check if payments already exist
    const { data: existingPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('lease_id', agreementId);
      
    if (paymentsError) {
      console.error('Error checking existing payments:', paymentsError);
      return { 
        success: false, 
        error: `Could not check existing payments: ${paymentsError.message}`,
        generatedCount: 0
      };
    }
    
    if (existingPayments && existingPayments.length > 0) {
      return {
        success: true,
        message: `This agreement already has ${existingPayments.length} payments. No need to generate more.`,
        generatedCount: 0
      };
    }
    
    // Create a basic payment for the agreement
    const { error: insertError } = await supabase
      .from('payments')
      .insert({
        lease_id: agreementId,
        amount: agreement.rent_amount,
        payment_date: new Date(agreement.start_date).toISOString(),
        type: 'rent',
        payment_method: 'scheduled',
        notes: 'Auto-generated payment'
      });
      
    if (insertError) {
      console.error('Error creating payment:', insertError);
      return { 
        success: false, 
        error: `Could not create payment: ${insertError.message}`,
        generatedCount: 0
      };
    }
    
    return {
      success: true,
      message: 'Successfully generated 1 payment for this agreement',
      generatedCount: 1
    };
      
  } catch (error) {
    console.error('Error in fixAgreementPayments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { 
      success: false, 
      error: `Error generating payments: ${errorMessage}`,
      generatedCount: 0
    };
  }
};
