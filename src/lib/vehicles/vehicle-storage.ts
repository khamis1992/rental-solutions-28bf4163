
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

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
      if (listError.message.includes('Storage service') || listError.message.includes('permission')) {
        console.warn('Storage API access error, likely a permissions issue');
      }
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
          
          // Set bucket public
          try {
            const { error: policyError } = await supabase.storage
              .from('vehicle-images')
              .getPublicUrl('test.txt');
              
            if (policyError) {
              console.warn('Cannot access public URL, might need to set policies:', policyError);
            }
          } catch (e) {
            console.warn('Error testing bucket access:', e);
          }
          
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
            
            // Specific error for policy-related issues
            if (serviceError.message.includes('policy') || serviceError.message.includes('permission')) {
              toast.error('Storage permission error', { 
                description: 'Cannot create storage bucket due to insufficient permissions.'
              });
            }
            
            return false;
          }
          
          console.log('Successfully created vehicle-images bucket with service role key');
          
          // Try to set public access policy
          try {
            // Set RLS policy to allow public access to the bucket
            const { data: policyData, error: policyError } = await serviceClient.storage
              .from('vehicle-images')
              .getPublicUrl('test.txt');
              
            if (policyError) {
              console.warn('Failed to test bucket access:', policyError);
            } else {
              console.log('Bucket is publicly accessible:', policyData);
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
        toast.error('Missing configuration', { 
          description: 'Service role key is not configured. Check your .env file.'
        });
        return false;
      }
    }
    
    console.log('vehicle-images bucket already exists');
    
    // Verify that the bucket is accessible
    try {
      const { data: files, error: accessError } = await supabase.storage
        .from('vehicle-images')
        .list();
        
      if (accessError) {
        console.warn('Cannot access vehicle-images bucket:', accessError);
        if (accessError.message.includes('policy') || accessError.message.includes('permission')) {
          toast.error('Storage access error', { 
            description: 'Cannot access storage bucket due to insufficient permissions.'
          });
        }
        return false;
      }
      
      console.log('Successfully accessed vehicle-images bucket, found', files?.length, 'files');
      return true;
    } catch (accessErr) {
      console.error('Error testing bucket access:', accessErr);
      return false;
    }
  } catch (error) {
    console.error('Error ensuring vehicle images bucket exists:', error);
    toast.error('Storage configuration error', { 
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
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
    
    // More specific error messages based on error type
    if (error.message.includes('policy') || error.message.includes('permission')) {
      throw new Error(`Permission denied: You don't have access to upload files to this bucket.`);
    }
    
    throw new Error(`Error uploading image: ${error.message}`);
  }
  
  return getImagePublicUrl('vehicle-images', filePath);
}
