
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';

// Ensure the vehicle-images bucket exists
export async function ensureVehicleImagesBucket(): Promise<boolean> {
  try {
    console.log('Checking if vehicle-images bucket exists...');
    
    // Get Supabase service role key from env
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    // Check if bucket exists with regular client first
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'vehicle-images');
    
    if (!bucketExists) {
      console.log('vehicle-images bucket does not exist, creating it...');
      
      // First try with regular client
      try {
        const { error: createError } = await supabase.storage
          .createBucket('vehicle-images', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
          });
          
        if (!createError) {
          console.log('Successfully created vehicle-images bucket with standard client');
          return true;
        }
        
        console.warn('Failed to create bucket with standard client:', createError);
      } catch (e) {
        console.warn('Error creating bucket with standard client:', e);
      }
      
      // If service role key is available, try with that
      if (supabaseServiceKey) {
        try {
          console.log('Creating bucket with service role key...');
          
          // IMPORTANT: Create service client with correct auth options
          const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          });
          
          const { error: serviceError } = await serviceClient.storage
            .createBucket('vehicle-images', {
              public: true,
              fileSizeLimit: 10485760, // 10MB
            });
          
          if (serviceError) {
            console.error('Error creating bucket with service role:', serviceError);
            return false;
          }
          
          console.log('Successfully created vehicle-images bucket with service role key');
          
          // Set RLS policy to allow public access to the bucket
          // Note: In production, you might want more restrictive policies
          try {
            const { error: policyError } = await serviceClient.storage
              .from('vehicle-images')
              .createSignedUrl('test.txt', 3600);
              
            if (policyError) {
              console.warn('Failed to test bucket access:', policyError);
            }
          } catch (policyErr) {
            console.warn('Error testing bucket policies:', policyErr);
          }
          
          return true;
        } catch (serviceErr) {
          console.error('Error with service client:', serviceErr);
          return false;
        }
      } else {
        console.error('No service role key available to create bucket');
        return false;
      }
    }
    
    console.log('vehicle-images bucket already exists');
    return true;
  } catch (error) {
    console.error('Error ensuring vehicle images bucket exists:', error);
    return false;
  }
}

// Get public URL for an image
export function getImagePublicUrl(bucket: string, path: string): string {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting public URL:', error);
    return '';
  }
}

// Upload a vehicle image
export async function uploadVehicleImage(file: File, id: string): Promise<string> {
  const bucketReady = await ensureVehicleImagesBucket();
  
  if (!bucketReady) {
    throw new Error('Failed to ensure vehicle-images bucket exists. Please check your Supabase configuration and try again.');
  }
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${id}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;
  
  const { error } = await supabase.storage
    .from('vehicle-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });
  
  if (error) {
    console.error('Upload error details:', error);
    throw new Error(`Error uploading image: ${error.message}`);
  }
  
  return getImagePublicUrl('vehicle-images', filePath);
}
