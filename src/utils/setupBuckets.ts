
import { createClient } from '@supabase/supabase-js';
import { supabase } from "@/lib/supabase";

/**
 * Ensures that the required storage buckets exist in Supabase
 */
export const ensureStorageBuckets = async (): Promise<{ success: boolean; error?: string; details?: any }> => {
  try {
    console.log('Setting up storage buckets...');
    
    // Get Supabase service role key from env
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseServiceKey) {
      console.error('Service role key is missing! This is required for bucket creation');
      return { 
        success: false, 
        error: 'Service role key is missing. Cannot create storage bucket. Check .env file.', 
      };
    }
    
    // IMPORTANT: Create a service client with the correct options
    // Fixing the invalid signature issue by properly configuring the client
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('Checking if agreements bucket exists...');
    
    // Check if agreements bucket exists using service client
    const { data: buckets, error: listError } = await serviceClient.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets with service client:', listError);
      return { 
        success: false, 
        error: `Failed to list buckets: ${listError.message}`, 
        details: listError 
      };
    }
    
    const agreementBucketExists = buckets?.some(bucket => bucket.name === 'agreements');
    
    if (!agreementBucketExists) {
      console.log('Agreements bucket does not exist, creating it with service role key...');
      
      try {
        // Create the bucket with service role client
        const { error: createError } = await serviceClient.storage.createBucket('agreements', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });
        
        if (createError) {
          console.error('Error creating bucket with service role key:', createError);
          
          // Special handling for RLS errors
          if (createError.message.includes('violates row-level security policy')) {
            console.error('Row-level security policy violation. This usually means the service role key is not bypassing RLS correctly.');
            
            return { 
              success: false, 
              error: 'Failed to create bucket: Row-level security policy violation. Check if the service role key has proper privileges.', 
              details: createError 
            };
          }
          
          return { 
            success: false, 
            error: `Failed to create bucket with service role key: ${createError.message}`, 
            details: createError 
          };
        }
        
        console.log('Successfully created agreements bucket!');
        
        // Test if bucket is accessible by uploading a test file
        const testFile = new Blob(['test'], { type: 'text/plain' });
        
        const { error: uploadError } = await serviceClient.storage
          .from('agreements')
          .upload('test-access.txt', testFile, { upsert: true });
        
        if (uploadError) {
          console.error('Error uploading test file:', uploadError);
          
          return { 
            success: true, 
            error: 'Bucket created but has access issues for uploads. Check RLS policies.',
            details: uploadError
          };
        }
        
        // Try to get a public URL for the test file
        const { data: urlData } = serviceClient.storage
          .from('agreements')
          .getPublicUrl('test-access.txt');
        
        let publicUrl = urlData.publicUrl;
        // Fix double slash issue if present
        publicUrl = publicUrl.replace(/\/\/agreements\//, '/agreements/');
        
        console.log('Test file public URL:', publicUrl);
        
        // Test URL by fetching it
        try {
          const response = await fetch(publicUrl, { method: 'HEAD' });
          if (!response.ok) {
            console.warn(`URL access test failed: ${response.status}`);
          } else {
            console.log('URL access test succeeded!');
          }
        } catch (fetchErr) {
          console.warn('URL fetch test error:', fetchErr);
        }
        
        return { success: true };
      } catch (serviceErr) {
        console.error('Exception creating bucket with service role key:', serviceErr);
        return { 
          success: false, 
          error: 'Exception during bucket creation with service role key. Check Supabase storage dashboard and RLS policies.', 
          details: serviceErr 
        };
      }
    }
    
    // If we get here, the bucket already exists
    console.log('Agreements bucket already exists, verifying access...');
    
    // Verify bucket is usable by trying to list files with service role client
    try {
      // First try with service role client for more reliable check
      const { data: serviceFiles, error: serviceListError } = await serviceClient.storage
        .from('agreements')
        .list('', { limit: 100 });
      
      if (serviceListError) {
        console.error('Error listing files with service client:', serviceListError);
        
        return { 
          success: false, 
          error: 'Bucket exists but has access issues. Check RLS policies.', 
          details: { serviceListError }
        };
      }
      
      console.log('Successfully listed files with service client:', serviceFiles);
      
      // If no test file exists, create one to verify write access
      if (!serviceFiles.some(file => file.name === 'test-access.txt')) {
        console.log('Creating test file to verify write access...');
        const testFile = new Blob(['test-access'], { type: 'text/plain' });
        
        const { error: uploadError } = await serviceClient.storage
          .from('agreements')
          .upload('test-access.txt', testFile, { upsert: true });
          
        if (uploadError) {
          console.warn('Write access test failed:', uploadError);
        } else {
          console.log('Write access test succeeded!');
        }
      }
      
      // Get and test public URL
      const { data: urlData } = serviceClient.storage
        .from('agreements')
        .getPublicUrl('test-access.txt');
        
      let publicUrl = urlData.publicUrl;
      // Fix double slash issue if present
      publicUrl = publicUrl.replace(/\/\/agreements\//, '/agreements/');
        
      console.log('Public URL test:', publicUrl);
      
      // Test URL by fetching it
      try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.warn(`URL access test failed: ${response.status}`);
        } else {
          console.log('URL access test succeeded!');
        }
      } catch (fetchErr) {
        console.warn('URL fetch test error:', fetchErr);
      }
      
      return { success: true, details: { files: serviceFiles } };
    } catch (final) {
      console.error('Error verifying bucket access:', final);
      return { 
        success: false, 
        error: 'Bucket exists but encountered error verifying access. Check RLS policies.', 
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
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    let serviceClient = null;
    
    if (supabaseServiceKey) {
      // IMPORTANT: Create service client with correct auth options to fix signature issues
      serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log('Created service client for diagnosis');
    }
    
    // Check bucket existence with both clients
    let bucketExists = false;
    let listError = null;
    
    try {
      // First try with service client for more reliable results
      if (serviceClient) {
        const { data: serviceBuckets, error: serviceListError } = await serviceClient.storage.listBuckets();
        bucketExists = serviceBuckets?.some(bucket => bucket.name === 'agreements') || false;
        
        if (!serviceListError && bucketExists) {
          console.log('Bucket found with service client');
          listError = null;
        } else {
          listError = serviceListError;
          
          // Fall back to regular client
          const { data: buckets, error: regListError } = await supabase.storage.listBuckets();
          bucketExists = bucketExists || (buckets?.some(bucket => bucket.name === 'agreements') || false);
          
          if (regListError && !bucketExists) {
            listError = regListError;
          }
        }
      } else {
        // Only try regular client
        const { data: buckets, error: regListError } = await supabase.storage.listBuckets();
        bucketExists = buckets?.some(bucket => bucket.name === 'agreements') || false;
        listError = regListError;
      }
    } catch (error) {
      listError = error;
    }
    
    // Test upload capability
    let canUpload = false;
    let uploadError = null;
    
    try {
      if (bucketExists) {
        const testFile = new Blob(['test-upload-diag'], { type: 'text/plain' });
        const client = serviceClient || supabase;
        
        const { error } = await client.storage.from('agreements').upload(`test-${Date.now()}.txt`, testFile, {
          upsert: true
        });
        
        canUpload = !error;
        uploadError = error;
      }
    } catch (error) {
      uploadError = error;
    }
    
    // Test URL generation
    let canGetPublicUrl = false;
    let urlError = null;
    let publicUrl = null;
    
    try {
      if (bucketExists) {
        const client = serviceClient || supabase;
        const publicUrlData = client.storage.from('agreements').getPublicUrl('test.txt');
        
        canGetPublicUrl = !!publicUrlData && !!publicUrlData.data && !!publicUrlData.data.publicUrl;
        
        if (canGetPublicUrl) {
          publicUrl = publicUrlData.data.publicUrl;
          
          // Check and fix double slash
          if (publicUrl.includes('//agreements/')) {
            publicUrl = publicUrl.replace('//agreements/', '/agreements/');
            console.log('Fixed double slash in URL:', publicUrl);
          }
        }
        
        if (!canGetPublicUrl) {
          urlError = 'Failed to generate public URL';
        }
      }
    } catch (error) {
      urlError = error;
    }
    
    // Test permissions
    let hasPermission = false;
    let permissionError = null;
    
    try {
      if (bucketExists) {
        const client = serviceClient || supabase;
        const { data, error } = await client.storage.from('agreements').list('', { limit: 100 });
        
        hasPermission = !error;
        permissionError = error;
      }
    } catch (error) {
      permissionError = error;
    }
    
    // Test URL access if we have a URL
    let canAccessUrl = false;
    let accessUrlError = null;
    
    if (publicUrl) {
      try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        canAccessUrl = response.ok;
        if (!response.ok) {
          accessUrlError = `HTTP Status: ${response.status}`;
        }
      } catch (error) {
        accessUrlError = error;
      }
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
        permissionError,
        publicUrl,
        canAccessUrl,
        accessUrlError
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
