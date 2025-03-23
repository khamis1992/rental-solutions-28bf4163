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
      
      // Try with service role key first - this is the most reliable method
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseServiceKey) {
        console.error('Service role key is missing! This is required for bucket creation');
        return { 
          success: false, 
          error: 'Service role key is missing. Cannot create storage bucket. Check .env file.', 
        };
      }
      
      console.log('Creating bucket using service role key...');
      
      try {
        // Create a new client with the service role key
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
        
        // First attempt to create the bucket with service role
        const { error: serviceError } = await serviceClient.storage.createBucket('agreements', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });
        
        if (serviceError) {
          console.error('Error creating bucket with service role key:', serviceError);
          return { 
            success: false, 
            error: `Failed to create bucket with service role key: ${serviceError.message}`, 
            details: serviceError 
          };
        }
        
        console.log('Successfully created agreements bucket!');
        
        // Setup public access policies
        try {
          // Test if bucket is accessible by creating a test file
          const testFile = new Blob(['test'], { type: 'text/plain' });
          
          const { error: uploadError } = await serviceClient.storage
            .from('agreements')
            .upload('test-access.txt', testFile, { upsert: true });
          
          if (uploadError) {
            console.error('Error uploading test file:', uploadError);
            return { 
              success: true, 
              error: 'Bucket created but may have permission issues for uploads',
              details: uploadError
            };
          }
          
          // Try to get a public URL for the test file
          const { data: urlData } = serviceClient.storage
            .from('agreements')
            .getPublicUrl('test-access.txt');
          
          console.log('Test file public URL:', urlData.publicUrl);
          
          console.log('Bucket created successfully with proper permissions');
          return { success: true };
        } catch (policyError) {
          console.error('Error setting up bucket policies:', policyError);
          return { 
            success: true, 
            error: 'Bucket created but has permission configuration issues',
            details: policyError
          };
        }
      } catch (serviceErr) {
        console.error('Exception creating bucket with service role key:', serviceErr);
        return { 
          success: false, 
          error: 'Exception during bucket creation with service role key', 
          details: serviceErr 
        };
      }
    }
    
    // If we get here, the bucket already exists
    console.log('Agreements bucket already exists');
    
    // Verify bucket is usable by trying to list files
    try {
      const { data: files, error: listFilesError } = await supabase.storage
        .from('agreements')
        .list();
      
      if (listFilesError) {
        console.error('Error listing files in agreements bucket:', listFilesError);
        return { 
          success: true, 
          error: 'Bucket exists but may have permission issues', 
          details: listFilesError 
        };
      }
      
      console.log('Successfully listed files in agreements bucket:', files);
      return { success: true, details: { files } };
    } catch (final) {
      console.error('Error verifying bucket access:', final);
      return { 
        success: true, 
        error: 'Bucket exists but encountered error verifying access', 
        details: final 
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

/**
 * Function to help debug bucket permissions
 */
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
