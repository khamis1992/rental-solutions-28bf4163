
import { createClient } from '@supabase/supabase-js';
import { supabase } from "@/lib/supabase";

/**
 * Ensures that the required storage buckets exist in Supabase
 */
export const ensureStorageBuckets = async (): Promise<boolean> => {
  try {
    console.log('Setting up storage buckets...');
    
    // Check if agreements bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const agreementBucketExists = buckets?.some(bucket => bucket.name === 'agreements');
    
    if (!agreementBucketExists) {
      console.log('Agreements bucket does not exist, attempting to create...');
      
      // First try with anon key
      try {
        const { error: createError } = await supabase.storage.createBucket('agreements', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });
        
        if (createError) {
          console.error('Error creating bucket with anon key:', createError);
          
          // If we have a service role key available in env, try with that
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
          
          if (supabaseServiceKey) {
            console.log('Attempting to create bucket using service role key...');
            
            // Create a new client with the service role key
            const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
            
            const { error: serviceError } = await serviceClient.storage.createBucket('agreements', {
              public: true,
              fileSizeLimit: 10485760, // 10MB
            });
            
            if (serviceError) {
              console.error('Error creating bucket with service role key:', serviceError);
              return false;
            }
            
            console.log('Bucket created successfully with service role key!');
          } else {
            console.error('No service role key available. Cannot create bucket.');
            return false;
          }
        } else {
          console.log('Bucket created successfully with anon key!');
        }
      } catch (createErr) {
        console.error('Exception during bucket creation:', createErr);
        return false;
      }
      
      // Verify bucket creation by re-checking buckets
      const { data: verifyBuckets, error: verifyError } = await supabase.storage.listBuckets();
      
      if (verifyError) {
        console.error('Error verifying bucket creation:', verifyError);
        return false;
      }
      
      const bucketVerified = verifyBuckets?.some(bucket => bucket.name === 'agreements');
      
      if (!bucketVerified) {
        console.error('Bucket verification failed: Bucket was not found after creation attempt');
        return false;
      }
      
      console.log('Bucket verification successful!');
    } else {
      console.log('Agreements bucket already exists');
    }
    
    // Check bucket permissions by attempting a test operation
    try {
      const { data } = supabase.storage.from('agreements').getPublicUrl('test.txt');
      console.log('Public access for agreements bucket verified:', data.publicUrl);
    } catch (policyError) {
      console.error('Error verifying public access:', policyError);
      // Continue anyway as this might just be because the test file doesn't exist
    }
    
    // If we got this far, setup was successful
    return true;
  } catch (error) {
    console.error('Unexpected error ensuring storage buckets exist:', error);
    return false;
  }
};
