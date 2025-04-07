import { AgreementWithDetails } from '@/hooks/use-agreements';
import { supabase } from '@/integrations/supabase/client';

// Function to create a security deposit payment
const createSecurityDepositPayment = async (agreementId: string, amount: number) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          agreement_id: agreementId,
          payment_date: new Date().toISOString(),
          amount: amount,
          payment_method: 'security_deposit',
          notes: 'Security deposit payment',
          type: 'security_deposit'
        }
      ]);

    if (error) {
      console.error('Error creating security deposit payment:', error);
      throw error;
    }

    console.log('Security deposit payment created successfully:', data);
  } catch (error) {
    console.error('Failed to create security deposit payment:', error);
    throw error;
  }
};

export const checkAndCreateMissingPaymentSchedules = async (agreements: AgreementWithDetails[]) => {
  if (!agreements || agreements.length === 0) {
    console.log('No agreements provided to check.');
    return;
  }

  console.log(`Checking ${agreements.length} agreements for missing payment schedules...`);

  for (const agreement of agreements) {
    try {
      if (!agreement.id) {
        console.warn('Agreement ID is missing. Skipping.');
        continue;
      }

      // Check if the agreement already has payment schedules
      const { data: existingPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('agreement_id', agreement.id);

      if (paymentsError) {
        console.error('Error fetching existing payments:', paymentsError);
        continue; // Skip to the next agreement
      }

      if (existingPayments && existingPayments.length > 0) {
        console.log(`Agreement ${agreement.id} already has ${existingPayments.length} payments. Skipping.`);
        continue; // Skip to the next agreement
      }

      // If no payment schedules exist, create them based on agreement details
      console.log(`No payment schedules found for agreement ${agreement.id}. Creating default schedules...`);

      // Check if we need to add a security deposit payment
      if (agreement.security_deposit_amount && agreement.security_deposit_amount > 0) {
        await createSecurityDepositPayment(agreement.id, agreement.security_deposit_amount);
      }
      
      // Create a single rent payment schedule
      const { data, error } = await supabase
        .from('payments')
        .insert([
          {
            agreement_id: agreement.id,
            payment_date: agreement.start_date,
            amount: agreement.rent_amount,
            payment_method: 'scheduled',
            notes: 'Initial rent payment',
            type: 'rent'
          }
        ]);

      if (error) {
        console.error('Error creating payment schedule:', error);
      } else {
        console.log('Payment schedule created successfully:', data);
      }
    } catch (error) {
      console.error(`Error processing agreement ${agreement.id}:`, error);
    }
  }

  console.log('All agreements checked and processed.');
};
