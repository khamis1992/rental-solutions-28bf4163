
import { AgreementWithDetails } from '@/hooks/use-agreements';
import { supabase } from '@/integrations/supabase/client';

// Function to check vehicle availability
export const checkVehicleAvailability = async (vehicleId: string) => {
  try {
    const { data, error } = await supabase
      .from('leases')
      .select('id, agreement_number, status, customer_id, start_date, end_date')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking vehicle availability:', error);
      throw error;
    }
    
    return {
      isAvailable: !data,
      existingAgreement: data || null
    };
  } catch (error) {
    console.error('Error checking vehicle availability:', error);
    return {
      isAvailable: true,
      existingAgreement: null
    };
  }
};

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

// Export adapter function
export const adaptSimpleToFullAgreement = (agreement: AgreementWithDetails) => {
  return {
    ...agreement,
    security_deposit_amount: agreement.security_deposit_amount || 0,
    deposit_amount: agreement.security_deposit_amount || 0
  };
};

// Function to update agreement and handle necessary checks
export const updateAgreementWithCheck = async (
  { id, data }: { id: string; data: any },
  userId?: string,
  onSuccess?: () => void,
  onError?: (error: any) => void
) => {
  try {
    // Update the agreement
    const { error } = await supabase
      .from('leases')
      .update({
        agreement_number: data.agreement_number,
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id,
        status: data.status,
        start_date: data.start_date,
        end_date: data.end_date,
        rent_amount: data.rent_amount,
        total_amount: data.total_amount,
        notes: data.notes,
        security_deposit_amount: data.security_deposit_amount || data.deposit_amount,
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating agreement:', error);
      if (onError) onError(error);
      throw error;
    }

    console.log('Agreement updated successfully');
    
    // If status is set to active, generate payment schedules
    if (data.status === 'active') {
      await checkAndCreateMissingPaymentSchedules([{
        id,
        rent_amount: data.rent_amount,
        security_deposit_amount: data.security_deposit_amount || data.deposit_amount,
        start_date: data.start_date
      }]);
    }
    
    if (onSuccess) onSuccess();
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update agreement:', error);
    throw error;
  }
};

// Function to activate an agreement
export const activateAgreement = async (agreementId: string) => {
  try {
    const { error } = await supabase
      .from('leases')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', agreementId);
      
    if (error) {
      console.error('Error activating agreement:', error);
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error activating agreement:', error);
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
        .eq('lease_id', agreement.id);

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
        .insert({
          lease_id: agreement.id,
          payment_date: agreement.start_date,
          amount: agreement.rent_amount || 0,
          payment_method: 'scheduled',
          notes: 'Initial rent payment',
          type: 'rent'
        });

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
