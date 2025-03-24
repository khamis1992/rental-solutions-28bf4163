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

// Use the updated system date (March 24, 2025) for all date-related operations
const SYSTEM_DATE = new Date(2025, 2, 24); // March 24, 2025

// Check if automatic payment generation is needed (run once daily)
export const checkAndGenerateMonthlyPayments = async () => {
  try {
    // Use the system date instead of actual date
    const today = SYSTEM_DATE;
    
    // Only run this on the 1st day of the month to generate payments for active agreements
    if (today.getDate() === 1) {
      console.log('Running monthly payment generation for active agreements');
      
      // Get all active agreements with rent_amount
      const { data: leases, error } = await supabase
        .from('leases')
        .select('id, rent_amount, agreement_number, start_date, end_date')
        .eq('status', 'active')
        .lt('start_date', today.toISOString()) // Agreement has started
        .gt('end_date', today.toISOString());   // Agreement has not ended yet
      
      if (error) {
        throw error;
      }
      
      if (leases && leases.length > 0) {
        console.log(`Found ${leases.length} active leases for payment generation`);
        
        // Generate a pending payment for each active agreement
        for (const lease of leases) {
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();
          
          console.log(`Processing lease ${lease.agreement_number}`);
          
          // Use the rent_amount if available, otherwise fallback to total_amount
          const amount = lease.rent_amount || 0;
          
          if (!amount) {
            console.log(`No rent_amount found for lease ${lease.agreement_number}, skipping payment generation`);
            continue;
          }
          
          const result = await generateMonthlyPayment(
            supabase,
            lease.id,
            amount,
            currentMonth,
            currentYear
          );
          
          if (result.success) {
            console.log(`Generated payment for lease ${lease.agreement_number}`);
          } else {
            console.log(`Payment already exists or failed for lease ${lease.agreement_number}: ${result.message || 'Unknown error'}`);
          }
        }
        
        return true;
      } else {
        console.log('No active leases found for payment generation');
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
    
    // Get all active agreements with rent_amount
    const { data: leases, error } = await supabase
      .from('leases')
      .select('id, rent_amount, agreement_number, status')
      .eq('status', 'active');
    
    if (error) {
      throw error;
    }
    
    if (leases && leases.length > 0) {
      console.log(`Found ${leases.length} active leases to check`);
      let generatedCount = 0;
      
      // Generate a pending payment for each active agreement
      for (const lease of leases) {
        console.log(`Checking current month payment for lease ${lease.agreement_number} (status: ${lease.status})`);
        
        if (lease.status !== 'active') {
          console.log(`Skipping lease ${lease.agreement_number} - not active (status: ${lease.status})`);
          continue;
        }
        
        // Use the rent_amount if available
        const amount = lease.rent_amount || 0;
        
        if (!amount) {
          console.log(`No rent_amount found for lease ${lease.agreement_number}, skipping payment generation`);
          continue;
        }
        
        const result = await generateMonthlyPayment(
          supabase,
          lease.id,
          amount,
          currentMonth,
          currentYear
        );
        
        if (result.success) {
          console.log(`Generated payment for lease ${lease.agreement_number}`);
          generatedCount++;
        } else {
          console.log(`No payment needed for lease ${lease.agreement_number}: ${result.message || 'Unknown error'}`);
        }
      }
      
      return { success: true, generated: generatedCount, checked: leases.length };
    } else {
      console.log('No active leases found');
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
    
    // First check if the agreement is still active and get the correct rent_amount
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("status, agreement_number, rent_amount")
      .eq("id", agreementId)
      .single();
    
    if (leaseError) {
      console.error("Error fetching lease:", leaseError);
      throw leaseError;
    }
    
    // If lease is not active, don't generate payments
    if (lease && lease.status !== 'active') {
      console.log(`Skipping missing payment generation for ${lease.agreement_number} - status is ${lease.status}`);
      return { success: false, message: `Lease is not active (status: ${lease.status})`, generated: 0 };
    }
    
    // Use the rent_amount from the lease if available, otherwise use the provided amount
    const paymentAmount = lease.rent_amount || amount;
    
    if (!paymentAmount) {
      console.log(`No rent_amount found for lease ${lease.agreement_number}, cannot generate payments`);
      return { success: false, message: "No rent amount available for this lease", generated: 0 };
    }
    
    // Get all existing payments for this agreement to avoid duplication
    const { data: existingPayments, error: paymentsError } = await supabase
      .from("unified_payments")
      .select("payment_date")
      .eq("lease_id", agreementId)
      .order("payment_date", { ascending: true });
      
    if (paymentsError) {
      console.error("Error fetching existing payments:", paymentsError);
      throw paymentsError;
    }
    
    console.log(`Found ${existingPayments ? existingPayments.length : 0} existing payments`);
    
    // Start with the month of the last payment (to ensure we don't miss the month right after the lastPaymentDate)
    // This helps ensure all months including the one right after lastPaymentDate are checked
    const startMonth = new Date(lastPaymentDate);
    startMonth.setDate(1); // First day of the month
    
    // End with the current month
    const endMonth = new Date(currentDate);
    endMonth.setDate(1); // First day of the current month
    
    console.log(`Checking for missing payments from ${startMonth.toLocaleDateString()} to ${endMonth.toLocaleDateString()}`);
    console.log(`Using payment amount: ${paymentAmount}`);
    
    let generatedCount = 0;
    // Start with the month of lastPaymentDate and loop month by month
    for (let year = startMonth.getFullYear(); year <= endMonth.getFullYear(); year++) {
      // Determine start and end months for this year
      const startMonthInYear = (year === startMonth.getFullYear()) ? startMonth.getMonth() : 0;
      const endMonthInYear = (year === endMonth.getFullYear()) ? endMonth.getMonth() : 11;
      
      for (let month = startMonthInYear; month <= endMonthInYear; month++) {
        // Skip the exact month where the last payment was made only if we're in the starting month AND year
        if (year === lastPaymentDate.getFullYear() && month === lastPaymentDate.getMonth()) {
          const dayOfMonth = lastPaymentDate.getDate();
          // If the last payment was made on the 1st, then skip this month entirely
          if (dayOfMonth === 1) {
            console.log(`Skipping exact month of last payment: ${new Date(year, month, 1).toLocaleDateString()}`);
            continue;
          }
          // Otherwise proceed to check if we have a payment for this month's 1st day
        }
        
        const paymentDate = new Date(year, month, 1);
        console.log(`Checking for payment on ${paymentDate.toLocaleDateString()}`);
        
        // Check if a payment already exists for this month's 1st day
        const paymentExists = existingPayments?.some(payment => {
          const existingDate = new Date(payment.payment_date);
          return existingDate.getFullYear() === year && 
                 existingDate.getMonth() === month &&
                 existingDate.getDate() === 1;
        });
        
        if (paymentExists) {
          console.log(`Payment already exists for ${paymentDate.toLocaleDateString()}`);
          continue;
        }
        
        // Create pending payment record for the 1st of the month using the correct rent_amount
        console.log(`Generating payment for ${paymentDate.toLocaleDateString()} with amount ${paymentAmount}`);
        const { data, error } = await supabase.from("unified_payments").insert({
          lease_id: agreementId,
          amount: paymentAmount,
          amount_paid: 0,
          balance: paymentAmount,
          payment_date: paymentDate.toISOString(),
          status: "pending",
          type: "Income",
          description: `Monthly rent payment for ${paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          original_due_date: paymentDate.toISOString(),
        }).select();
        
        if (error) {
          console.error(`Error creating payment for ${paymentDate.toLocaleDateString()}:`, error);
          throw error;
        }
        
        generatedCount++;
        console.log(`Successfully generated payment for ${paymentDate.toLocaleDateString()}`);
      }
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
