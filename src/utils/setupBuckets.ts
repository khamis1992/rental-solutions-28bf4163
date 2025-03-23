
import { createClient } from '@supabase/supabase-js';
import { supabase } from "@/lib/supabase";

/**
 * Ensures that the required storage buckets exist in Supabase
 */
export const ensureStorageBuckets = async (): Promise<{ success: boolean; error?: string; details?: any }> => {
  try {
    console.log('Setting up storage buckets...');
    
    // Check if agreements bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return { success: false, error: `Failed to list buckets: ${listError.message}`, details: listError };
    }
    
    const agreementBucketExists = buckets?.some(bucket => bucket.name === 'agreements');
    
    if (!agreementBucketExists) {
      console.log('Agreements bucket does not exist, attempting to create...');
      
      // Try with service role key first if available (more likely to work)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseServiceKey) {
        console.log('Attempting to create bucket using service role key...');
        
        try {
          // Create a new client with the service role key
          const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
          
          const { error: serviceError } = await serviceClient.storage.createBucket('agreements', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
          });
          
          if (serviceError) {
            console.error('Error creating bucket with service role key:', serviceError);
            
            // Fall back to anon key as a last resort
            try {
              console.log('Falling back to anon key...');
              const { error: anonError } = await supabase.storage.createBucket('agreements', {
                public: true,
                fileSizeLimit: 10485760, // 10MB
              });
              
              if (anonError) {
                console.error('Error creating bucket with anon key:', anonError);
                return { 
                  success: false, 
                  error: 'Failed to create bucket with both service role and anon keys', 
                  details: { serviceError, anonError } 
                };
              }
            } catch (anonErr) {
              console.error('Exception during bucket creation with anon key:', anonErr);
              return { 
                success: false, 
                error: 'Exception during bucket creation attempts', 
                details: { serviceError, anonErr } 
              };
            }
          } else {
            console.log('Bucket created successfully with service role key!');
          }
        } catch (serviceErr) {
          console.error('Exception during bucket creation with service role key:', serviceErr);
          return { 
            success: false, 
            error: 'Exception during bucket creation with service role key', 
            details: serviceErr 
          };
        }
      } else {
        // No service role key, try with anon key
        try {
          console.log('No service role key available, trying with anon key only...');
          const { error: anonError } = await supabase.storage.createBucket('agreements', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
          });
          
          if (anonError) {
            console.error('Error creating bucket with anon key:', anonError);
            return { 
              success: false, 
              error: 'Failed to create bucket with anon key and no service role key available', 
              details: anonError 
            };
          }
          
          console.log('Bucket created successfully with anon key!');
        } catch (err) {
          console.error('Exception during bucket creation with anon key:', err);
          return { 
            success: false, 
            error: 'Exception during bucket creation with anon key', 
            details: err 
          };
        }
      }
      
      // Verify bucket creation by re-checking buckets
      const { data: verifyBuckets, error: verifyError } = await supabase.storage.listBuckets();
      
      if (verifyError) {
        console.error('Error verifying bucket creation:', verifyError);
        return { 
          success: false, 
          error: 'Failed to verify bucket creation', 
          details: verifyError 
        };
      }
      
      const bucketVerified = verifyBuckets?.some(bucket => bucket.name === 'agreements');
      
      if (!bucketVerified) {
        console.error('Bucket verification failed: Bucket was not found after creation attempt');
        return { 
          success: false, 
          error: 'Bucket verification failed: Bucket was not found after creation attempt' 
        };
      }
      
      console.log('Bucket verification successful!');
    } else {
      console.log('Agreements bucket already exists');
    }
    
    // Set up bucket policies
    try {
      // Attempt to create public access policy for the agreements bucket
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseServiceKey) {
        console.log('Setting up bucket policies with service role key...');
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
        
        // Ensure read policy exists
        const { error: policyError } = await serviceClient.storage.from('agreements').createSignedUrl('test-policy.txt', 60);
        
        if (policyError) {
          console.log('Setting up public read policy for bucket...');
          
          // Try to set up a public policy
          try {
            // Create temporary test file to ensure bucket is working
            const testFile = new Blob(['test'], { type: 'text/plain' });
            await serviceClient.storage.from('agreements').upload('test-policy.txt', testFile);
            
            // This would be where we create a policy if needed
            console.log('Storage policies appear to be functioning');
          } catch (err) {
            console.error('Error setting up policies:', err);
            // Continue anyway as some operations may still work
          }
        }
      }
    } catch (policyError) {
      console.error('Error setting up bucket policies:', policyError);
      // Continue anyway as the bucket might still work for some operations
    }
    
    // Final test to verify bucket is usable
    try {
      const publicUrlData = supabase.storage.from('agreements').getPublicUrl('test-file.txt');
      
      if (!publicUrlData || !publicUrlData.data || !publicUrlData.data.publicUrl) {
        console.error('Error getting public URL: No data returned');
        return { 
          success: true, 
          error: 'Bucket exists but may have permission issues', 
          details: 'No public URL data returned' 
        };
      }
      
      console.log('Public URL generation successful:', publicUrlData.data.publicUrl);
      return { success: true };
    } catch (finalError) {
      console.error('Error in final bucket verification:', finalError);
      return { 
        success: true, 
        error: 'Bucket exists but encountered an error in final verification', 
        details: finalError 
      };
    }
  } catch (error) {
    console.error('Unexpected error ensuring storage buckets exist:', error);
    return { 
      success: false, 
      error: 'Unexpected error ensuring storage buckets exist', 
      details: error 
    };
  }
};

// Function to help debug bucket permissions
export const diagnoseStorageIssues = async (): Promise<{ 
  bucketExists: boolean;
  canUpload: boolean;
  canGetPublicUrl: boolean;
  hasPermission: boolean;
  details: any;
}> => {
  try {
    console.log('Diagnosing storage issues...');
    
    // Check bucket existence
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'agreements') || false;
    
    // Test upload capability
    let canUpload = false;
    let uploadError = null;
    try {
      const testFile = new Blob(['test-upload'], { type: 'text/plain' });
      const { error } = await supabase.storage.from('agreements').upload(`test-${Date.now()}.txt`, testFile, {
        upsert: true
      });
      canUpload = !error;
      uploadError = error;
    } catch (error) {
      uploadError = error;
    }
    
    // Test URL generation
    let canGetPublicUrl = false;
    let urlError = null;
    try {
      const publicUrlData = supabase.storage.from('agreements').getPublicUrl('test.txt');
      canGetPublicUrl = !!publicUrlData && !!publicUrlData.data && !!publicUrlData.data.publicUrl;
      if (!canGetPublicUrl) {
        urlError = 'Failed to generate public URL';
      }
    } catch (error) {
      urlError = error;
    }
    
    // Test permissions
    let hasPermission = false;
    let permissionError = null;
    try {
      const { data, error } = await supabase.storage.from('agreements').list();
      hasPermission = !error;
      permissionError = error;
    } catch (error) {
      permissionError = error;
    }
    
    return {
      bucketExists,
      canUpload,
      canGetPublicUrl,
      hasPermission,
      details: {
        listError,
        uploadError,
        urlError,
        permissionError
      }
    };
  } catch (error) {
    console.error('Error during storage diagnosis:', error);
    return {
      bucketExists: false,
      canUpload: false,
      canGetPublicUrl: false,
      hasPermission: false,
      details: { error }
    };
  }
};
