import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Create a sample agreement for testing purposes
 * This should only be used in development environments
 */
export const createSampleAgreement = async (): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> => {
  try {
    console.log('Creating sample agreement...');
    
    // First, check if we have any customers
    const { data: customers, error: customersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'customer')
      .limit(1);
    
    if (customersError) {
      console.error('Error fetching customers:', customersError);
      return {
        success: false,
        message: `Failed to fetch customers: ${customersError.message}`
      };
    }
    
    if (!customers || customers.length === 0) {
      return {
        success: false,
        message: 'No customers found. Please create a customer first.'
      };
    }
    
    // Next, check if we have any vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id')
      .limit(1);
    
    if (vehiclesError) {
      console.error('Error fetching vehicles:', vehiclesError);
      return {
        success: false,
        message: `Failed to fetch vehicles: ${vehiclesError.message}`
      };
    }
    
    if (!vehicles || vehicles.length === 0) {
      return {
        success: false,
        message: 'No vehicles found. Please create a vehicle first.'
      };
    }
    
    // Create a sample agreement
    const customerId = customers[0].id;
    const vehicleId = vehicles[0].id;
    
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(today.getMonth() + 6); // 6-month lease
    
    const agreementNumber = `AGR-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-0001`;
    
    const { data: agreement, error: agreementError } = await supabase
      .from('leases')
      .insert({
        customer_id: customerId,
        vehicle_id: vehicleId,
        agreement_number: agreementNumber,
        start_date: today.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        rent_amount: 2500,
        deposit_amount: 5000,
        total_amount: 15000,
        payment_frequency: 'monthly',
        payment_day: 1,
        daily_late_fee: 100
      })
      .select()
      .single();
    
    if (agreementError) {
      console.error('Error creating sample agreement:', agreementError);
      return {
        success: false,
        message: `Failed to create sample agreement: ${agreementError.message}`
      };
    }
    
    return {
      success: true,
      message: 'Sample agreement created successfully',
      data: agreement
    };
  } catch (error) {
    console.error('Unexpected error creating sample agreement:', error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Run the create sample agreement function and show a toast with the result
 */
export const runCreateSampleAgreement = async (): Promise<void> => {
  const result = await createSampleAgreement();
  
  if (result.success) {
    toast.success('Sample agreement created', {
      description: result.message
    });
  } else {
    toast.error('Failed to create sample agreement', {
      description: result.message
    });
  }
  
  console.log('Create sample agreement result:', result);
};
