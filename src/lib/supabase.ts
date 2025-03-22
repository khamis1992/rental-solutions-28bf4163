import { createClient } from '@supabase/supabase-js';
import { generateMonthlyPayment, forceGeneratePaymentForAgreement } from './validation-schemas/agreement';

// Get the environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Check for missing variables, but don't block initialization
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Anon Key. Please add them to your environment variables.');
}

// Create the Supabase client
export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
);

// Helper function to ensure vehicle-images bucket exists
export const ensureVehicleImagesBucket = async (): Promise<boolean> => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'vehicle-images');
    
    if (!bucketExists) {
      // First try with current client
      try {
        const { error: createError } = await supabase.storage.createBucket('vehicle-images', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });
        
        if (!createError) {
          console.log('Vehicle images bucket created successfully with anon key');
          return true;
        }
      } catch (e) {
        console.error('Error creating bucket with anon key:', e);
      }
      
      // If the bucket doesn't exist and service key is available, try with that
      if (supabaseServiceKey) {
        try {
          const serviceClient = createClient(
            supabaseUrl || '',
            supabaseServiceKey
          );
          
          const { error: serviceError } = await serviceClient.storage.createBucket('vehicle-images', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
          });
          
          if (serviceError) {
            console.error('Error creating bucket with service role:', serviceError);
            return false;
          }
          
          console.log('Vehicle images bucket created successfully with service role key');
          return true;
        } catch (error) {
          console.error('Error with service role client:', error);
          return false;
        }
      } else {
        console.error('No service role key available to create bucket');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring vehicle images bucket exists:', error);
    return false;
  }
};

// Helper function to get image URL with public URL transformation
export const getImagePublicUrl = (bucket: string, path: string): string => {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting public URL:', error);
    return '';
  }
};

// Helper to format data for display with camelCase keys for legacy UI compatibility
export const formatVehicleForDisplay = (vehicle: any): any => {
  if (!vehicle) return null;
  
  return {
    ...vehicle,
    imageUrl: vehicle.image_url,
    licensePlate: vehicle.license_plate,
    dailyRate: vehicle.rent_amount || (vehicle.vehicleType?.daily_rate || 0),
    category: vehicle.vehicleType?.size || 'midsize', // Map to existing frontend category
    features: vehicle.vehicleType?.features || [],
    notes: vehicle.description
  };
};

// Use the updated system date (March 22, 2025) for all date-related operations
const SYSTEM_DATE = new Date(2025, 2, 22); // March 22, 2025

// Check if automatic payment generation is needed (run once daily)
export const checkAndGenerateMonthlyPayments = async () => {
  try {
    // Use the system date instead of actual date
    const today = SYSTEM_DATE;
    
    // Only run this on the 1st day of the month to generate payments for active agreements
    if (today.getDate() === 1) {
      console.log('Running monthly payment generation for active agreements');
      
      // Get all active agreements
      const { data: agreements, error } = await supabase
        .from('agreements')
        .select('id, total_amount, start_date, end_date, agreement_number')
        .eq('status', 'active')
        .lt('start_date', today.toISOString()) // Agreement has started
        .gt('end_date', today.toISOString());   // Agreement has not ended yet
      
      if (error) {
        throw error;
      }
      
      if (agreements && agreements.length > 0) {
        console.log(`Found ${agreements.length} active agreements for payment generation`);
        
        // Generate a pending payment for each active agreement
        for (const agreement of agreements) {
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();
          
          console.log(`Processing agreement ${agreement.agreement_number}`);
          
          const result = await generateMonthlyPayment(
            supabase,
            agreement.id,
            agreement.total_amount,
            currentMonth,
            currentYear
          );
          
          if (result.success) {
            console.log(`Generated payment for agreement ${agreement.agreement_number}`);
          } else {
            console.log(`Payment already exists or failed for agreement ${agreement.agreement_number}: ${result.message || 'Unknown error'}`);
          }
        }
        
        return true;
      } else {
        console.log('No active agreements found for payment generation');
      }
    } else {
      console.log(`Today is not the 1st of the month (using system date: ${today.toDateString()}), skipping automatic payment generation`);
    }
    
    return false;
  } catch (error) {
    console.error('Error generating monthly payments:', error);
    return false;
  }
};

// Function to force generate payments for a specific agreement by ID
export const generatePaymentForAgreement = async (agreementId: string) => {
  try {
    if (!agreementId) {
      return { success: false, message: "No agreement ID provided" };
    }
    
    console.log(`Manually generating payment for agreement ID: ${agreementId}`);
    
    const result = await forceGeneratePaymentForAgreement(supabase, agreementId);
    
    return result;
  } catch (error) {
    console.error("Error manually generating payment:", error);
    return { success: false, error };
  }
};

// Function to force check all agreements regardless of date
export const forceCheckAllAgreementsForPayments = async () => {
  try {
    // Use the system date instead of actual date
    const today = SYSTEM_DATE;
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    console.log(`Force checking all active agreements for payment generation (system date: ${today.toDateString()})`);
    
    // Get all active agreements
    const { data: agreements, error } = await supabase
      .from('agreements')
      .select('id, total_amount, agreement_number, status')
      .eq('status', 'active');
    
    if (error) {
      throw error;
    }
    
    if (agreements && agreements.length > 0) {
      console.log(`Found ${agreements.length} active agreements to check`);
      let generatedCount = 0;
      
      // Generate a pending payment for each active agreement
      for (const agreement of agreements) {
        console.log(`Checking current month payment for agreement ${agreement.agreement_number} (status: ${agreement.status})`);
        
        if (agreement.status !== 'active') {
          console.log(`Skipping agreement ${agreement.agreement_number} - not active (status: ${agreement.status})`);
          continue;
        }
        
        const result = await generateMonthlyPayment(
          supabase,
          agreement.id,
          agreement.total_amount,
          currentMonth,
          currentYear
        );
        
        if (result.success) {
          console.log(`Generated payment for agreement ${agreement.agreement_number}`);
          generatedCount++;
        } else {
          console.log(`No payment needed for agreement ${agreement.agreement_number}: ${result.message || 'Unknown error'}`);
        }
      }
      
      return { success: true, generated: generatedCount, checked: agreements.length };
    } else {
      console.log('No active agreements found');
      return { success: true, generated: 0, checked: 0 };
    }
  } catch (error) {
    console.error('Error force checking agreements for payments:', error);
    return { success: false, error };
  }
};

// New function to generate missing monthly payments for an agreement
export const forceGeneratePaymentsForMissingMonths = async (
  agreementId: string,
  amount: number,
  lastPaymentDate: Date,
  currentDate: Date = SYSTEM_DATE
) => {
  try {
    console.log(`Checking for missing payments between ${lastPaymentDate.toISOString()} and ${currentDate.toISOString()}`);
    
    // First check if the agreement is still active
    const { data: agreement, error: agreementError } = await supabase
      .from("agreements")
      .select("status, agreement_number")
      .eq("id", agreementId)
      .single();
    
    if (agreementError) {
      console.error("Error fetching agreement:", agreementError);
      throw agreementError;
    }
    
    // If agreement is not active, don't generate payments
    if (agreement && agreement.status !== 'active') {
      console.log(`Skipping missing payment generation for ${agreement.agreement_number} - status is ${agreement.status}`);
      return { success: false, message: `Agreement is not active (status: ${agreement.status})`, generated: 0 };
    }
    
    // Start from the month after the last payment
    const startMonth = new Date(lastPaymentDate);
    startMonth.setDate(1); // First day of the month
    
    // End with the current month
    const endMonth = new Date(currentDate);
    endMonth.setDate(1); // First day of the current month
    
    console.log(`Checking for missing payments from ${startMonth.toISOString()} to ${endMonth.toISOString()}`);
    
    let generatedCount = 0;
    let currentCheckMonth = new Date(startMonth);
    
    // Loop through each month and generate missing payments
    while (currentCheckMonth <= endMonth) {
      const year = currentCheckMonth.getFullYear();
      const month = currentCheckMonth.getMonth();
      
      console.log(`Checking for payment in ${currentCheckMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
      
      // Check if payment for this month already exists
      const { data: existingPayments, error: checkError } = await supabase
        .from("unified_payments")
        .select("id")
        .eq("lease_id", agreementId)
        .gte("payment_date", new Date(year, month, 1).toISOString())
        .lt("payment_date", new Date(year, month + 1, 1).toISOString());
      
      if (checkError) {
        console.error("Error checking existing payments:", checkError);
        throw checkError;
      }
      
      // If no payment exists for this month, generate one
      if (!existingPayments || existingPayments.length === 0) {
        console.log(`Generating missing payment for ${currentCheckMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
        
        // Create payment date for the 1st of the specified month
        const paymentDate = new Date(year, month, 1);
        
        // Create pending payment record directly
        const { data, error } = await supabase.from("unified_payments").insert({
          lease_id: agreementId,
          amount: amount,
          amount_paid: 0,
          balance: amount,
          payment_date: paymentDate.toISOString(),
          status: "pending",
          type: "Income",
          description: `Monthly rent payment for ${paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          original_due_date: paymentDate.toISOString(),
        }).select();
        
        if (error) {
          console.error(`Error creating payment for ${paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}:`, error);
          throw error;
        }
        
        generatedCount++;
        console.log(`Successfully generated missing payment for ${currentCheckMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
      } else {
        console.log(`Payment already exists for ${currentCheckMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
      }
      
      // Move to next month
      currentCheckMonth.setMonth(currentCheckMonth.getMonth() + 1);
    }
    
    return { 
      success: true, 
      generated: generatedCount, 
      message: `Generated ${generatedCount} missing payments between ${startMonth.toLocaleString('default', { month: 'long', year: 'numeric' })} and ${endMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}` 
    };
  } catch (error) {
    console.error("Error generating missing monthly payments:", error);
    return { success: false, error, generated: 0 };
  }
};

// Add a function to initialize the system with a check for payment generation
export const initializeSystem = async () => {
  // Check for bucket
  await ensureVehicleImagesBucket();
  
  // Check for payments that need to be generated
  await checkAndGenerateMonthlyPayments();
  
  return true;
};
