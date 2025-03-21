
import { createClient } from '@supabase/supabase-js';

// Get the environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
      // Use service role key for creating buckets (assumes SUPABASE_SERVICE_ROLE_KEY is set)
      const adminClient = createClient(
        supabaseUrl || '',
        import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
      );
      
      const { error: createError } = await adminClient.storage.createBucket('vehicle-images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error('Error creating bucket with service role:', createError);
        return false;
      }
      
      console.log('Vehicle images bucket created successfully');
      return true;
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
