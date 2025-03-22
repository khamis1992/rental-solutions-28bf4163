import { createClient } from '@supabase/supabase-js';
import { generateMonthlyPayment } from './validation-schemas/agreement';

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

// Check if automatic payment generation is needed (run once daily)
export const checkAndGenerateMonthlyPayments = async () => {
  try {
    const today = new Date();
    
    // Only run this on the 1st day of the month to generate payments for active agreements
    if (today.getDate() === 1) {
      console.log('Running monthly payment generation for active agreements');
      
      // Get all active agreements
      const { data: agreements, error } = await supabase
        .from('agreements')
        .select('id, total_amount, start_date, end_date')
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
          
          const result = await generateMonthlyPayment(
            supabase,
            agreement.id,
            agreement.total_amount,
            currentMonth,
            currentYear
          );
          
          if (result.success) {
            console.log(`Generated payment for agreement ${agreement.id}`);
          } else {
            console.log(`Payment already exists or failed for agreement ${agreement.id}`);
          }
        }
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error generating monthly payments:', error);
    return false;
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
