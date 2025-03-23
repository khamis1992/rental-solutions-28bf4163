
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
      console.log('Agreements bucket does not exist, creating...');
      
      // Attempt to create the bucket with explicit public access settings
      const { error: createError } = await supabase.storage.createBucket('agreements', {
        public: true, // Make bucket public
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error('Error creating agreements bucket:', createError);
        
        // If the error message indicates a permissions issue, log a more helpful message
        if (createError.message.includes('permission') || createError.message.includes('not authorized')) {
          console.error('Permission error: You may need admin/service role to create buckets.');
        }
        
        return false;
      }
      
      console.log('Agreements bucket created successfully');
      
      // Verify bucket creation by re-checking buckets
      const { data: verifyBuckets, error: verifyError } = await supabase.storage.listBuckets();
      
      if (verifyError) {
        console.error('Error verifying bucket creation:', verifyError);
        return false;
      }
      
      const bucketVerified = verifyBuckets?.some(bucket => bucket.name === 'agreements');
      
      if (!bucketVerified) {
        console.error('Bucket verification failed: Bucket was not found after creation');
        return false;
      }
      
      console.log('Bucket verification successful');
      
      // Test bucket accessibility by attempting to get a public URL
      try {
        supabase.storage.from('agreements').getPublicUrl('test.txt');
        console.log('Public access for agreements bucket verified');
      } catch (policyError) {
        console.error('Error verifying public access:', policyError);
        // Continue anyway as this might just be because the test file doesn't exist
      }
    } else {
      console.log('Agreements bucket already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring storage buckets exist:', error);
    return false;
  }
};
